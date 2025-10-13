// SPDX-License-Identifier: MIT
// BitVault - Bitcoin Yield Vaults on Starknet
// ERC-4626 Compliant Tokenized Vault System

%lang starknet

from starknet.contracts.library import Ownable
from starknet.contracts.library import ERC20
from starknet.contracts.library import AccessControl
from starknet.contracts.library import Pausable
from starknet.contracts.library import ReentrancyGuard

// Import standard libraries
from starknet.contracts.library import Math
from starknet.contracts.library import SafeMath

// Events
@event
func Deposit(
    caller: felt,
    owner: felt,
    assets: Uint256,
    shares: Uint256
):
end

@event
func Withdraw(
    caller: felt,
    receiver: felt,
    owner: felt,
    assets: Uint256,
    shares: Uint256
):
end

@event
func VaultCreated(
    vault_id: felt,
    vault_type: felt,
    lock_period: felt,
    apy_bps: felt
):
end

@event
func YieldGenerated(
    vault_id: felt,
    amount: Uint256,
    timestamp: felt
):
end

@event
func EmergencyWithdraw(
    vault_id: felt,
    amount: Uint256,
    timestamp: felt
):
end

// Storage
@storage_var
func asset(): (ContractAddress) {
}

@storage_var
func total_assets(): (Uint256) {
}

@storage_var
func total_supply(): (Uint256) {
}

@storage_var
func vault_count(): (felt) {
}

@storage_var
func vault_type(vault_id: felt): (felt) {
}

@storage_var
func vault_lock_period(vault_id: felt): (felt) {
}

@storage_var
func vault_apy_bps(vault_id: felt): (felt) {
}

@storage_var
func vault_total_assets(vault_id: felt): (Uint256) {
}

@storage_var
func vault_total_supply(vault_id: felt): (Uint256) {
}

@storage_var
func vault_active(vault_id: felt): (bool) {
}

@storage_var
func user_deposits(user: felt, vault_id: felt): (Uint256) {
}

@storage_var
func user_shares(user: felt, vault_id: felt): (Uint256) {
}

@storage_var
func user_lock_timestamp(user: felt, vault_id: felt): (felt) {
}

@storage_var
func yield_strategy(vault_id: felt): (ContractAddress) {
}

@storage_var
func management_fee_bps(): (felt) {
}

@storage_var
func performance_fee_bps(): (felt) {
}

@storage_var
func treasury(): (ContractAddress) {
}

@storage_var
func emergency_mode(): (bool) {
}

// Constants
const VAULT_TYPE_FLEXIBLE: felt = 1
const VAULT_TYPE_BALANCED: felt = 2
const VAULT_TYPE_MAXIMUM: felt = 3

const LOCK_PERIOD_FLEXIBLE: felt = 7 * 24 * 60 * 60  // 7 days in seconds
const LOCK_PERIOD_BALANCED: felt = 30 * 24 * 60 * 60  // 30 days in seconds
const LOCK_PERIOD_MAXIMUM: felt = 90 * 24 * 60 * 60   // 90 days in seconds

const APY_FLEXIBLE_BPS: felt = 650   // 6.5% in basis points
const APY_BALANCED_BPS: felt = 980   // 9.8% in basis points
const APY_MAXIMUM_BPS: felt = 1240   // 12.4% in basis points

const BASIS_POINTS: felt = 10000
const SECONDS_PER_YEAR: felt = 365 * 24 * 60 * 60

const MIN_DEPOSIT_FLEXIBLE: Uint256 = Uint256(10000000000000000, 0)  // 0.01 BTC (18 decimals)
const MIN_DEPOSIT_BALANCED: Uint256 = Uint256(10000000000000000, 0)  // 0.01 BTC
const MIN_DEPOSIT_MAXIMUM: Uint256 = Uint256(50000000000000000, 0)   // 0.05 BTC

// Constructor
@constructor
func constructor{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(
    asset_token: ContractAddress,
    treasury_address: ContractAddress,
    admin: felt
):
    Ownable.initializer(admin)
    AccessControl.initializer()
    
    let (caller) = get_caller_address()
    AccessControl._grant_role(ADMIN_ROLE, caller)
    
    asset.write(asset_token)
    treasury.write(treasury_address)
    management_fee_bps.write(200)  // 2% management fee
    performance_fee_bps.write(1000)  // 10% performance fee
    
    // Initialize vault count
    vault_count.write(0)
    
    // Create default vaults
    _create_vault(VAULT_TYPE_FLEXIBLE, LOCK_PERIOD_FLEXIBLE, APY_FLEXIBLE_BPS)
    _create_vault(VAULT_TYPE_BALANCED, LOCK_PERIOD_BALANCED, APY_BALANCED_BPS)
    _create_vault(VAULT_TYPE_MAXIMUM, LOCK_PERIOD_MAXIMUM, APY_MAXIMUM_BPS)
    
    return ()
end

// External functions

@external
func deposit{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(vault_id: felt, assets: Uint256, receiver: felt) -> (shares: Uint256):
    alloc_locals
    
    // Validate inputs
    assert vault_active.read(vault_id) = TRUE, "Vault not active"
    assert assets.low > 0 or assets.high > 0, "Invalid amount"
    
    let (caller) = get_caller_address()
    let (receiver_address) = if receiver == 0: caller else: receiver
    
    // Check minimum deposit based on vault type
    let (vault_type) = vault_type.read(vault_id)
    let (min_deposit) = _get_min_deposit(vault_type)
    assert assets >= min_deposit, "Below minimum deposit"
    
    // Calculate shares to mint
    let (shares_to_mint) = _convert_to_shares(assets, vault_id)
    assert shares_to_mint.low > 0 or shares_to_mint.high > 0, "Invalid shares"
    
    // Transfer assets from caller
    let (asset_token) = asset.read()
    IERC20.transferFrom(asset_token, caller, @contract_address, assets)
    
    // Update vault state
    let (current_assets) = vault_total_assets.read(vault_id)
    let (current_supply) = vault_total_supply.read(vault_id)
    
    vault_total_assets.write(vault_id, current_assets + assets)
    vault_total_supply.write(vault_id, current_supply + shares_to_mint)
    
    // Update user state
    let (user_current_deposits) = user_deposits.read(receiver_address, vault_id)
    let (user_current_shares) = user_shares.read(receiver_address, vault_id)
    
    user_deposits.write(receiver_address, vault_id, user_current_deposits + assets)
    user_shares.write(receiver_address, vault_id, user_current_shares + shares_to_mint)
    user_lock_timestamp.write(receiver_address, vault_id, get_block_timestamp())
    
    // Emit events
    Deposit.emit(caller, receiver_address, assets, shares_to_mint)
    
    return (shares_to_mint)
end

@external
func withdraw{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(vault_id: felt, shares: Uint256, receiver: felt, owner: felt) -> (assets: Uint256):
    alloc_locals
    
    // Validate inputs
    assert vault_active.read(vault_id) = TRUE, "Vault not active"
    assert shares.low > 0 or shares.high > 0, "Invalid shares"
    
    let (caller) = get_caller_address()
    let (owner_address) = if owner == 0: caller else: owner
    let (receiver_address) = if receiver == 0: caller else: receiver
    
    // Check if caller is authorized to withdraw
    if caller != owner_address:
        let (allowance) = allowance.read(owner_address, caller)
        assert allowance >= shares, "Insufficient allowance"
        let (new_allowance) = allowance - shares
        allowance.write(owner_address, caller, new_allowance)
    
    // Check lock period
    let (lock_timestamp) = user_lock_timestamp.read(owner_address, vault_id)
    let (lock_period) = vault_lock_period.read(vault_id)
    let (current_time) = get_block_timestamp()
    
    assert current_time >= lock_timestamp + lock_period, "Still locked"
    
    // Calculate assets to withdraw
    let (assets_to_withdraw) = _convert_to_assets(shares, vault_id)
    assert assets_to_withdraw.low > 0 or assets_to_withdraw.high > 0, "Invalid assets"
    
    // Update vault state
    let (current_assets) = vault_total_assets.read(vault_id)
    let (current_supply) = vault_total_supply.read(vault_id)
    
    vault_total_assets.write(vault_id, current_assets - assets_to_withdraw)
    vault_total_supply.write(vault_id, current_supply - shares)
    
    // Update user state
    let (user_current_deposits) = user_deposits.read(owner_address, vault_id)
    let (user_current_shares) = user_shares.read(owner_address, vault_id)
    
    user_deposits.write(owner_address, vault_id, user_current_deposits - assets_to_withdraw)
    user_shares.write(owner_address, vault_id, user_current_shares - shares)
    
    // Transfer assets to receiver
    let (asset_token) = asset.read()
    IERC20.transfer(asset_token, receiver_address, assets_to_withdraw)
    
    // Emit events
    Withdraw.emit(caller, receiver_address, owner_address, assets_to_withdraw, shares)
    
    return (assets_to_withdraw)
end

@external
func emergency_withdraw{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(vault_id: felt, shares: Uint256) -> (assets: Uint256):
    alloc_locals
    
    // Only allow in emergency mode
    assert emergency_mode.read() = TRUE, "Not in emergency mode"
    
    let (caller) = get_caller_address()
    let (user_shares_balance) = user_shares.read(caller, vault_id)
    assert shares <= user_shares_balance, "Insufficient shares"
    
    // Calculate assets (without yield)
    let (user_deposits_amount) = user_deposits.read(caller, vault_id)
    let (user_total_shares) = user_shares.read(caller, vault_id)
    
    let (assets_to_withdraw) = Uint256(0, 0)
    if user_total_shares.low > 0 or user_total_shares.high > 0:
        let (scaled_shares) = shares * user_deposits_amount
        assets_to_withdraw = scaled_shares / user_total_shares
    
    // Update vault state
    let (current_assets) = vault_total_assets.read(vault_id)
    let (current_supply) = vault_total_supply.read(vault_id)
    
    vault_total_assets.write(vault_id, current_assets - assets_to_withdraw)
    vault_total_supply.write(vault_id, current_supply - shares)
    
    // Update user state
    let (user_current_deposits) = user_deposits.read(caller, vault_id)
    let (user_current_shares) = user_shares.read(caller, vault_id)
    
    user_deposits.write(caller, vault_id, user_current_deposits - assets_to_withdraw)
    user_shares.write(caller, vault_id, user_current_shares - shares)
    
    // Transfer assets
    let (asset_token) = asset.read()
    IERC20.transfer(asset_token, caller, assets_to_withdraw)
    
    // Emit events
    EmergencyWithdraw.emit(vault_id, assets_to_withdraw, get_block_timestamp())
    
    return (assets_to_withdraw)
end

@external
func generate_yield{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(vault_id: felt, yield_amount: Uint256):
    alloc_locals
    
    // Only admin or yield strategy can call
    let (caller) = get_caller_address()
    let (has_admin_role) = AccessControl.has_role(ADMIN_ROLE, caller)
    let (strategy_address) = yield_strategy.read(vault_id)
    
    assert has_admin_role = TRUE or caller = strategy_address, "Unauthorized"
    
    // Update vault total assets
    let (current_assets) = vault_total_assets.read(vault_id)
    vault_total_assets.write(vault_id, current_assets + yield_amount)
    
    // Emit event
    YieldGenerated.emit(vault_id, yield_amount, get_block_timestamp())
    
    return ()
end

@external
func create_vault{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(vault_type_param: felt, lock_period: felt, apy_bps: felt) -> (vault_id: felt):
    alloc_locals
    
    // Only admin can create vaults
    let (caller) = get_caller_address()
    let (has_admin_role) = AccessControl.has_role(ADMIN_ROLE, caller)
    assert has_admin_role = TRUE, "Unauthorized"
    
    let (new_vault_id) = vault_count.read() + 1
    vault_count.write(new_vault_id)
    
    vault_type.write(new_vault_id, vault_type_param)
    vault_lock_period.write(new_vault_id, lock_period)
    vault_apy_bps.write(new_vault_id, apy_bps)
    vault_total_assets.write(new_vault_id, Uint256(0, 0))
    vault_total_supply.write(new_vault_id, Uint256(0, 0))
    vault_active.write(new_vault_id, TRUE)
    
    VaultCreated.emit(new_vault_id, vault_type_param, lock_period, apy_bps)
    
    return (new_vault_id)
end

@external
func set_yield_strategy{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(vault_id: felt, strategy_address: ContractAddress):
    alloc_locals
    
    // Only admin can set yield strategy
    let (caller) = get_caller_address()
    let (has_admin_role) = AccessControl.has_role(ADMIN_ROLE, caller)
    assert has_admin_role = TRUE, "Unauthorized"
    
    yield_strategy.write(vault_id, strategy_address)
    
    return ()
end

@external
func set_emergency_mode{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(enabled: bool):
    alloc_locals
    
    // Only admin can set emergency mode
    let (caller) = get_caller_address()
    let (has_admin_role) = AccessControl.has_role(ADMIN_ROLE, caller)
    assert has_admin_role = TRUE, "Unauthorized"
    
    emergency_mode.write(enabled)
    
    return ()
end

// View functions

@view
func get_vault_info(vault_id: felt) -> (
    vault_type: felt,
    lock_period: felt,
    apy_bps: felt,
    total_assets: Uint256,
    total_supply: Uint256,
    active: bool
):
    alloc_locals
    
    let (vault_type) = vault_type.read(vault_id)
    let (lock_period) = vault_lock_period.read(vault_id)
    let (apy_bps) = vault_apy_bps.read(vault_id)
    let (total_assets) = vault_total_assets.read(vault_id)
    let (total_supply) = vault_total_supply.read(vault_id)
    let (active) = vault_active.read(vault_id)
    
    return (vault_type, lock_period, apy_bps, total_assets, total_supply, active)
end

@view
func get_user_position(user: felt, vault_id: felt) -> (
    deposits: Uint256,
    shares: Uint256,
    lock_timestamp: felt,
    can_withdraw: bool
):
    alloc_locals
    
    let (deposits) = user_deposits.read(user, vault_id)
    let (shares) = user_shares.read(user, vault_id)
    let (lock_timestamp) = user_lock_timestamp.read(user, vault_id)
    
    let (lock_period) = vault_lock_period.read(vault_id)
    let (current_time) = get_block_timestamp()
    let (can_withdraw) = current_time >= lock_timestamp + lock_period
    
    return (deposits, shares, lock_timestamp, can_withdraw)
end

@view
func preview_deposit(vault_id: felt, assets: Uint256) -> (shares: Uint256):
    alloc_locals
    
    let (shares) = _convert_to_shares(assets, vault_id)
    return (shares)
end

@view
func preview_withdraw(vault_id: felt, shares: Uint256) -> (assets: Uint256):
    alloc_locals
    
    let (assets) = _convert_to_assets(shares, vault_id)
    return (assets)
end

@view
func get_total_vaults() -> (count: felt):
    alloc_locals
    
    let (count) = vault_count.read()
    return (count)
end

// Internal functions

func _create_vault{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(vault_type_param: felt, lock_period: felt, apy_bps: felt):
    alloc_locals
    
    let (new_vault_id) = vault_count.read() + 1
    vault_count.write(new_vault_id)
    
    vault_type.write(new_vault_id, vault_type_param)
    vault_lock_period.write(new_vault_id, lock_period)
    vault_apy_bps.write(new_vault_id, apy_bps)
    vault_total_assets.write(new_vault_id, Uint256(0, 0))
    vault_total_supply.write(new_vault_id, Uint256(0, 0))
    vault_active.write(new_vault_id, TRUE)
    
    VaultCreated.emit(new_vault_id, vault_type_param, lock_period, apy_bps)
    
    return ()
end

func _convert_to_shares{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(assets: Uint256, vault_id: felt) -> (shares: Uint256):
    alloc_locals
    
    let (total_supply) = vault_total_supply.read(vault_id)
    
    // If no shares exist, 1:1 conversion
    if total_supply.low = 0 and total_supply.high = 0:
        return (assets)
    
    let (total_assets) = vault_total_assets.read(vault_id)
    let (shares) = assets * total_supply / total_assets
    
    return (shares)
end

func _convert_to_assets{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(shares: Uint256, vault_id: felt) -> (assets: Uint256):
    alloc_locals
    
    let (total_supply) = vault_total_supply.read(vault_id)
    let (total_assets) = vault_total_assets.read(vault_id)
    
    let (assets) = shares * total_assets / total_supply
    
    return (assets)
end

func _get_min_deposit(vault_type: felt) -> (min_deposit: Uint256):
    alloc_locals
    
    if vault_type = VAULT_TYPE_FLEXIBLE:
        return (MIN_DEPOSIT_FLEXIBLE)
    elif vault_type = VAULT_TYPE_BALANCED:
        return (MIN_DEPOSIT_BALANCED)
    elif vault_type = VAULT_TYPE_MAXIMUM:
        return (MIN_DEPOSIT_MAXIMUM)
    else:
        return (MIN_DEPOSIT_FLEXIBLE)
end

// ERC20 Interface Implementation
@view
func name() -> (res: felt):
    return ('BitVault Vault Token')
end

@view
func symbol() -> (res: felt):
    return ('BVVT')
end

@view
func decimals() -> (res: felt):
    return (18)
end

@view
func totalSupply() -> (res: Uint256):
    let (res) = total_supply.read()
    return (res)
end

@view
func balanceOf(account: felt) -> (res: Uint256):
    let (res) = balance.read(account)
    return (res)
end

@view
func allowance(owner: felt, spender: felt) -> (res: Uint256):
    let (res) = allowance.read(owner, spender)
    return (res)
end

@external
func transfer(recipient: felt, amount: Uint256) -> (res: bool):
    alloc_locals
    
    let (caller) = get_caller_address()
    let (caller_balance) = balance.read(caller)
    assert caller_balance >= amount, "Insufficient balance"
    
    let (new_caller_balance) = caller_balance - amount
    let (recipient_balance) = balance.read(recipient)
    let (new_recipient_balance) = recipient_balance + amount
    
    balance.write(caller, new_caller_balance)
    balance.write(recipient, new_recipient_balance)
    
    Transfer.emit(caller, recipient, amount)
    
    return (TRUE)
end

@external
func transferFrom(sender: felt, recipient: felt, amount: Uint256) -> (res: bool):
    alloc_locals
    
    let (caller) = get_caller_address()
    let (sender_balance) = balance.read(sender)
    let (current_allowance) = allowance.read(sender, caller)
    
    assert sender_balance >= amount, "Insufficient balance"
    assert current_allowance >= amount, "Insufficient allowance"
    
    let (new_sender_balance) = sender_balance - amount
    let (recipient_balance) = balance.read(recipient)
    let (new_recipient_balance) = recipient_balance + amount
    let (new_allowance) = current_allowance - amount
    
    balance.write(sender, new_sender_balance)
    balance.write(recipient, new_recipient_balance)
    allowance.write(sender, caller, new_allowance)
    
    Transfer.emit(sender, recipient, amount)
    
    return (TRUE)
end

@external
func approve(spender: felt, amount: Uint256) -> (res: bool):
    alloc_locals
    
    let (caller) = get_caller_address()
    allowance.write(caller, spender, amount)
    
    Approval.emit(caller, spender, amount)
    
    return (TRUE)
end

// ERC4626 Interface Implementation
@view
func asset() -> (res: ContractAddress):
    let (res) = asset.read()
    return (res)
end

@view
func totalAssets() -> (res: Uint256):
    let (res) = total_assets.read()
    return (res)
end

@view
func convertToShares(assets: Uint256) -> (res: Uint256):
    alloc_locals
    
    // Use the first vault (Flexible) for general conversion
    let (res) = _convert_to_shares(assets, 1)
    return (res)
end

@view
func convertToAssets(shares: Uint256) -> (res: Uint256):
    alloc_locals
    
    // Use the first vault (Flexible) for general conversion
    let (res) = _convert_to_assets(shares, 1)
    return (res)
end

@view
func maxDeposit(caller: felt) -> (res: Uint256):
    // Return maximum possible value
    return (Uint256(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF))
end

@view
func maxMint(caller: felt) -> (res: Uint256):
    // Return maximum possible value
    return (Uint256(0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF))
end

@view
func maxWithdraw(owner: felt) -> (res: Uint256):
    alloc_locals
    
    // Calculate total withdrawable assets across all vaults
    let (total_withdrawable) = Uint256(0, 0)
    let (vault_count) = vault_count.read()
    
    let (i) = 1
    loop:
        if i > vault_count:
            break
        end
        
        let (user_shares) = user_shares.read(owner, i)
        if user_shares.low > 0 or user_shares.high > 0:
            let (withdrawable_assets) = _convert_to_assets(user_shares, i)
            total_withdrawable = total_withdrawable + withdrawable_assets
        end
        
        let (i) = i + 1
    end
    
    return (total_withdrawable)
end

@view
func maxRedeem(owner: felt) -> (res: Uint256):
    alloc_locals
    
    // Calculate total redeemable shares across all vaults
    let (total_redeemable) = Uint256(0, 0)
    let (vault_count) = vault_count.read()
    
    let (i) = 1
    loop:
        if i > vault_count:
            break
        end
        
        let (user_shares) = user_shares.read(owner, i)
        total_redeemable = total_redeemable + user_shares
        
        let (i) = i + 1
    end
    
    return (total_redeemable)
end

// Additional utility functions

@external
func mint{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(vault_id: felt, shares: Uint256, receiver: felt) -> (assets: Uint256):
    alloc_locals
    
    // Calculate assets needed for shares
    let (assets_needed) = _convert_to_assets(shares, vault_id)
    
    // Call deposit function
    let (deposited_assets) = deposit(vault_id, assets_needed, receiver)
    
    return (deposited_assets)
end

@external
func redeem{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}(vault_id: felt, shares: Uint256, receiver: felt, owner: felt) -> (assets: Uint256):
    alloc_locals
    
    // Call withdraw function
    let (withdrawn_assets) = withdraw(vault_id, shares, receiver, owner)
    
    return (withdrawn_assets)
end

// Emergency functions

@external
func pause{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}():
    alloc_locals
    
    let (caller) = get_caller_address()
    let (has_admin_role) = AccessControl.has_role(ADMIN_ROLE, caller)
    assert has_admin_role = TRUE, "Unauthorized"
    
    Pausable._pause()
    
    return ()
end

@external
func unpause{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr: felt*,
    bitwise_ptr: BitwiseBuiltin*,
    ecdsa_ptr: SignatureBuiltin*
}():
    alloc_locals
    
    let (caller) = get_caller_address()
    let (has_admin_role) = AccessControl.has_role(ADMIN_ROLE, caller)
    assert has_admin_role = TRUE, "Unauthorized"
    
    Pausable._unpause()
    
    return ()
end

// Access control functions
@external
func grantRole(role: felt, account: felt):
    AccessControl.grant_role(role, account)
    return ()
end

@external
func revokeRole(role: felt, account: felt):
    AccessControl.revoke_role(role, account)
    return ()
end

@external
func renounceRole(role: felt, account: felt):
    AccessControl.renounce_role(role, account)
    return ()
end

@view
func hasRole(role: felt, account: felt) -> (res: bool):
    let (res) = AccessControl.has_role(role, account)
    return (res)
end

@view
func getRoleAdmin(role: felt) -> (res: felt):
    let (res) = AccessControl.get_role_admin(role)
    return (res)
end

// Ownership functions
@external
func transferOwnership(newOwner: felt):
    Ownable.transfer_ownership(newOwner)
    return ()
end

@external
func renounceOwnership():
    Ownable.renounce_ownership()
    return ()
end

@view
func owner() -> (res: felt):
    let (res) = Ownable.owner()
    return (res)
end

// Additional view functions for frontend integration

@view
func get_vault_stats() -> (
    total_vaults: felt,
    total_tvl: Uint256,
    total_users: felt
):
    alloc_locals
    
    let (total_vaults) = vault_count.read()
    let (total_tvl) = Uint256(0, 0)
    let (total_users) = 0  // This would need to be tracked separately
    
    // Calculate total TVL across all vaults
    let (i) = 1
    loop:
        if i > total_vaults:
            break
        end
        
        let (vault_assets) = vault_total_assets.read(i)
        total_tvl = total_tvl + vault_assets
        
        let (i) = i + 1
    end
    
    return (total_vaults, total_tvl, total_users)
end

@view
func get_user_vault_summary(user: felt) -> (
    total_deposits: Uint256,
    total_shares: Uint256,
    active_vaults: felt
):
    alloc_locals
    
    let (total_deposits) = Uint256(0, 0)
    let (total_shares) = Uint256(0, 0)
    let (active_vaults) = 0
    let (vault_count) = vault_count.read()
    
    let (i) = 1
    loop:
        if i > vault_count:
            break
        end
        
        let (user_deposits) = user_deposits.read(user, i)
        let (user_shares) = user_shares.read(user, i)
        
        if user_deposits.low > 0 or user_deposits.high > 0:
            total_deposits = total_deposits + user_deposits
            total_shares = total_shares + user_shares
            let (active_vaults) = active_vaults + 1
        end
        
        let (i) = i + 1
    end
    
    return (total_deposits, total_shares, active_vaults)
end