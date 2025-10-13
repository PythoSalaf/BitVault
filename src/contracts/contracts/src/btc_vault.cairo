

#[starknet::contract]
mod btc_vault {
    use starknet::{ContractAddress, get_contract_address, get_caller_address, get_block_timestamp};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess};

    // ==============
    // IERC20 interface
    // ==============
    #[starknet::interface]
    trait IERC20<T> {
        fn transfer_from(self: @T, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
        fn transfer(self: @T, recipient: ContractAddress, amount: u256) -> bool;
        fn balance_of(self: @T, account: ContractAddress) -> u256;
        fn approve(self: @T, spender: ContractAddress, amount: u256) -> bool;
    }

    // ===============
    // rbBTC interface
    // ===============
    #[starknet::interface]
    trait IrbBTC<T> {
        fn mint(self: @T, to: ContractAddress, amount: u256);
        fn burn(self: @T, from: ContractAddress, amount: u256);
    }

    // =====================
    // Vesu: Singleton interface 
    // =====================
    #[derive(Drop, Copy, Serde)]
    struct Amount {
        value: u256,
        is_negative: bool,
    }

    #[derive(Drop, Serde)]
    struct ModifyPositionParams {
        pool_id: felt252,
        collateral_asset: ContractAddress,
        debt_asset: ContractAddress,
        user: ContractAddress,
        collateral: Amount,
        debt: Amount,
        data: Array<felt252>,
    }

    #[starknet::interface]
    trait ISingleton<T> {
        fn modify_position(self: @T, params: ModifyPositionParams);
        fn position(self: @T, pool_id: felt252, collateral_asset: ContractAddress, debt_asset: ContractAddress, user: ContractAddress) -> ((), u256, u256);
        fn asset(self: @T, pool_id: felt252, asset: ContractAddress) -> (u256, u256, u256, u256); // total_collateral, total_nominal_debt, total_debt, last_rate_accumulator
    }

    // =====================
    // Vesu: Extension interface for price oracles
    // =====================
    #[starknet::interface]
    trait IExtension<T> {
        fn price(self: @T, asset: ContractAddress) -> u256;
    }

    // ====================
    // Vault storage
    // ====================
    #[storage]
    struct Storage {
        // Core vault config
        wbtc_token: ContractAddress,
        pool_id: felt252,
        singleton: ContractAddress,
        extension: ContractAddress, // For price oracles
        rb_token: ContractAddress,
        
        // User data
        user_balances: Map<ContractAddress, u256>,
        total_deposited: u256,
        
        // Vault management
        owner: ContractAddress,
        paused: bool,
        min_deposit: u256,
        last_rebalance: u64,
        
        // Fee structure
        deposit_fee_rate: u256, // Fee in basis points (100 = 1%)
        withdraw_fee_rate: u256,
        performance_fee_rate: u256,
        fee_recipient: ContractAddress,
    }

    // =====================
    // Events
    // =====================
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        DepositEvent: DepositEvent,
        WithdrawEvent: WithdrawEvent,
        RebalanceEvent: RebalanceEvent,
        FeesCollectedEvent: FeesCollectedEvent,
        VaultPausedEvent: VaultPausedEvent,
    }

    #[derive(Drop, starknet::Event)]
    struct DepositEvent {
        user: ContractAddress,
        amount: u256,
        shares_minted: u256,
        fee_charged: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct WithdrawEvent {
        user: ContractAddress,
        amount: u256,
        shares_burned: u256,
        fee_charged: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct RebalanceEvent {
        old_position: u256,
        new_position: u256,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct FeesCollectedEvent {
        fee_type: felt252, // 'deposit', 'withdraw', 'performance'
        amount: u256,
        recipient: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct VaultPausedEvent {
        paused: bool,
    }

    // ================
    // Constructor with Sepolia addresses
    // ================
    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        wbtc_token: ContractAddress, // Sepolia WBTC: 0xabbd6f1e590eb83addd87ba5ac27960d859b1f17d11a3c1cd6a0006704b1410
        pool_id: felt252, // Genesis pool: 730993554056884283224259059297934576024721456828383733531590831263129347422
        rb_token: ContractAddress,
    ) {
        // Sepolia Vesu contract addresses
        self.singleton.write(0x01ecab07456147a8de92b9273dd6789893401e8462a737431493980d9be6827.try_into().unwrap());
        self.extension.write(0x0571efca8cae0e426cb7052dad04badded0855b4cd6c6f475639af3356bc33fe.try_into().unwrap()); // Extension PO
        
        // Vault configuration
        self.wbtc_token.write(wbtc_token);
        self.pool_id.write(pool_id);
        self.rb_token.write(rb_token);
        self.owner.write(owner);
        
        // Default settings
        self.paused.write(false);
        self.min_deposit.write(1000); // Minimum deposit amount
        self.deposit_fee_rate.write(50); // 0.5%
        self.withdraw_fee_rate.write(50); // 0.5%
        self.performance_fee_rate.write(1000); // 10%
        self.fee_recipient.write(owner);
        self.total_deposited.write(0);
        self.last_rebalance.write(get_block_timestamp());
    }

    // =======================
    // Interface definition
    // =======================
    #[starknet::interface]
    trait IVault<T> {
        fn deposit_to_vesu(ref self: T, amount: u256);
        fn withdraw_from_vesu(ref self: T, amount: u256);
        fn get_vault_position(self: @T) -> (u256, u256);
        fn get_asset_stats(self: @T) -> (u256, u256, u256, u256);
        fn get_asset_price(self: @T) -> u256;
        fn pause(ref self: T);
        fn unpause(ref self: T);
        fn set_fee_rates(ref self: T, deposit_fee: u256, withdraw_fee: u256, performance_fee: u256);
        fn get_user_balance(self: @T, user: ContractAddress) -> u256;
        fn get_total_deposited(self: @T) -> u256;
        fn is_paused(self: @T) -> bool;
        fn get_owner(self: @T) -> ContractAddress;
        fn get_min_deposit(self: @T) -> u256;
        fn get_deposit_fee_rate(self: @T) -> u256;
        fn get_withdraw_fee_rate(self: @T) -> u256;
        fn get_performance_fee_rate(self: @T) -> u256;
        fn get_pool_id(self: @T) -> felt252;
        fn get_singleton_address(self: @T) -> ContractAddress;
        fn get_extension_address(self: @T) -> ContractAddress;
        fn set_min_deposit(ref self: T, min_deposit: u256);
    }

    // ==============================
    // Enhanced deposit with fee handling
    // ==============================
    #[external(v0)]
    fn deposit_to_vesu(ref self: ContractState, amount: u256) {
        assert!(!self.paused.read(), "vault-paused");
        assert!(amount >= self.min_deposit.read(), "amount-too-small");
        
        let caller = get_caller_address();
        let token_address = self.wbtc_token.read();

        // Calculate deposit fee
        let fee_rate = self.deposit_fee_rate.read();
        let fee_amount = (amount * fee_rate) / 10000; // Fee in basis points
        let net_amount = amount - fee_amount;

        // Transfer tokens from user
        let token = IERC20Dispatcher { contract_address: token_address };
        let success = token.transfer_from(caller, get_contract_address(), amount);
        assert!(success, "transfer-failed");

        // Transfer fee to fee recipient if applicable
        if fee_amount > 0 {
            let fee_recipient = self.fee_recipient.read();
            token.transfer(fee_recipient, fee_amount);
            self.emit(Event::FeesCollectedEvent(FeesCollectedEvent {
                fee_type: 'deposit',
                amount: fee_amount,
                recipient: fee_recipient,
            }));
        }

        // Call Vesu Singleton to deposit collateral
        let singleton = ISingletonDispatcher {
            contract_address: self.singleton.read()
        };

        let modify_params = ModifyPositionParams {
            pool_id: self.pool_id.read(),
            collateral_asset: token_address,
            debt_asset: token_address,
            user: get_contract_address(),
            collateral: Amount { value: net_amount, is_negative: false },
            debt: Amount { value: 0, is_negative: false },
            data: array![],
        };

        singleton.modify_position(modify_params);

        // Update user balance and total deposited
        let old_balance = self.user_balances.read(caller);
        self.user_balances.write(caller, old_balance + net_amount);
        self.total_deposited.write(self.total_deposited.read() + net_amount);

        // Mint rbBTC tokens to user
        let rb = IrbBTCDispatcher { contract_address: self.rb_token.read() };
        rb.mint(caller, net_amount);

        self.emit(Event::DepositEvent(DepositEvent {
            user: caller,
            amount: amount,
            shares_minted: net_amount,
            fee_charged: fee_amount,
        }));
    }

    // ==============================
    // Enhanced withdraw with fee handling
    // ==============================
    #[external(v0)]
    fn withdraw_from_vesu(ref self: ContractState, amount: u256) {
        assert!(!self.paused.read(), "vault-paused");
        
        let caller = get_caller_address();
        let token_address = self.wbtc_token.read();

        let current_balance = self.user_balances.read(caller);
        assert!(current_balance >= amount, "insufficient-balance");

        // Calculate withdraw fee
        let fee_rate = self.withdraw_fee_rate.read();
        let fee_amount = (amount * fee_rate) / 10000; // Fee in basis points
        let net_amount = amount - fee_amount;

        // Update user balance and total deposited
        self.user_balances.write(caller, current_balance - amount);
        self.total_deposited.write(self.total_deposited.read() - amount);

        // Call Vesu Singleton to withdraw collateral
        let singleton = ISingletonDispatcher {
            contract_address: self.singleton.read()
        };

        let modify_params = ModifyPositionParams {
            pool_id: self.pool_id.read(),
            collateral_asset: token_address,
            debt_asset: token_address,
            user: get_contract_address(),
            collateral: Amount { value: amount, is_negative: true },
            debt: Amount { value: 0, is_negative: false },
            data: array![],
        };

        singleton.modify_position(modify_params);

        // Transfer tokens to user (minus fee)
        let token = IERC20Dispatcher { contract_address: token_address };
        token.transfer(caller, net_amount);

        // Transfer fee to fee recipient if applicable
        if fee_amount > 0 {
            let fee_recipient = self.fee_recipient.read();
            token.transfer(fee_recipient, fee_amount);
            self.emit(Event::FeesCollectedEvent(FeesCollectedEvent {
                fee_type: 'withdraw',
                amount: fee_amount,
                recipient: fee_recipient,
            }));
        }

        // Burn rbBTC tokens from user
        let rb = IrbBTCDispatcher { contract_address: self.rb_token.read() };
        rb.burn(caller, amount);

        self.emit(Event::WithdrawEvent(WithdrawEvent {
            user: caller,
            amount: amount,
            shares_burned: amount,
            fee_charged: fee_amount,
        }));
    }

    // ==============================
    // Get vault position from Vesu
    // ==============================
    #[external(v0)]
    fn get_vault_position(self: @ContractState) -> (u256, u256) {
        let singleton = ISingletonDispatcher {
            contract_address: self.singleton.read()
        };
        let pool_id = self.pool_id.read();
        let asset = self.wbtc_token.read();

        let (_, collateral, debt) = singleton.position(pool_id, asset, asset, get_contract_address());
        (collateral, debt)
    }

    // ==============================
    // Get asset statistics from Vesu
    // ==============================
    #[external(v0)]
    fn get_asset_stats(self: @ContractState) -> (u256, u256, u256, u256) {
        let singleton = ISingletonDispatcher {
            contract_address: self.singleton.read()
        };
        let pool_id = self.pool_id.read();
        let asset = self.wbtc_token.read();

        singleton.asset(pool_id, asset)
    }

    // ==============================
    // Get asset price from oracle
    // ==============================
    #[external(v0)]
    fn get_asset_price(self: @ContractState) -> u256 {
        let extension = IExtensionDispatcher {
            contract_address: self.extension.read()
        };
        let asset = self.wbtc_token.read();

        extension.price(asset)
    }

    // ==============================
    // Owner-only functions
    // ==============================
    #[external(v0)]
    fn pause(ref self: ContractState) {
        assert!(get_caller_address() == self.owner.read(), "only-owner");
        self.paused.write(true);
        self.emit(Event::VaultPausedEvent(VaultPausedEvent { paused: true }));
    }

    #[external(v0)]
    fn unpause(ref self: ContractState) {
        assert!(get_caller_address() == self.owner.read(), "only-owner");
        self.paused.write(false);
        self.emit(Event::VaultPausedEvent(VaultPausedEvent { paused: false }));
    }

    #[external(v0)]
    fn set_fee_rates(ref self: ContractState, deposit_fee: u256, withdraw_fee: u256, performance_fee: u256) {
        assert!(get_caller_address() == self.owner.read(), "only-owner");
        assert!(deposit_fee <= 1000, "fee-too-high"); // Max 10%
        assert!(withdraw_fee <= 1000, "fee-too-high"); // Max 10%
        assert!(performance_fee <= 2000, "fee-too-high"); // Max 20%

        self.deposit_fee_rate.write(deposit_fee);
        self.withdraw_fee_rate.write(withdraw_fee);
        self.performance_fee_rate.write(performance_fee);
    }

    // ==============================
    // View functions
    // ==============================
    #[external(v0)]
    fn get_user_balance(self: @ContractState, user: ContractAddress) -> u256 {
        self.user_balances.read(user)
    }

    #[external(v0)]
    fn get_total_deposited(self: @ContractState) -> u256 {
        self.total_deposited.read()
    }

    #[external(v0)]
    fn is_paused(self: @ContractState) -> bool {
        self.paused.read()
    }

    #[external(v0)]
    fn get_owner(self: @ContractState) -> ContractAddress {
        self.owner.read()
    }

    #[external(v0)]
    fn get_min_deposit(self: @ContractState) -> u256 {
        self.min_deposit.read()
    }

    #[external(v0)]
    fn get_deposit_fee_rate(self: @ContractState) -> u256 {
        self.deposit_fee_rate.read()
    }

    #[external(v0)]
    fn get_withdraw_fee_rate(self: @ContractState) -> u256 {
        self.withdraw_fee_rate.read()
    }

    #[external(v0)]
    fn get_performance_fee_rate(self: @ContractState) -> u256 {
        self.performance_fee_rate.read()
    }

    #[external(v0)]
    fn get_pool_id(self: @ContractState) -> felt252 {
        self.pool_id.read()
    }

    #[external(v0)]
    fn get_singleton_address(self: @ContractState) -> ContractAddress {
        self.singleton.read()
    }

    #[external(v0)]
    fn get_extension_address(self: @ContractState) -> ContractAddress {
        self.extension.read()
    }

    #[external(v0)]
    fn set_min_deposit(ref self: ContractState, min_deposit: u256) {
        assert!(get_caller_address() == self.owner.read(), "only-owner");
        self.min_deposit.write(min_deposit);
    }
} 
