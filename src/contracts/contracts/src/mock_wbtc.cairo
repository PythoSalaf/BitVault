// Mock WBTC — Starknet Sepolia test token
// Public mint() so any wallet can self-fund during testing.
// DO NOT deploy on mainnet.

#[starknet::contract]
mod MockWBTC {
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess,
        StoragePathEntry, Map,
    };
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        balances:   Map<ContractAddress, u256>,
        allowances: Map<ContractAddress, Map<ContractAddress, u256>>,
        total_supply: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer:  Transfer,
        Approval:  Approval,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        #[key] from: ContractAddress,
        #[key] to:   ContractAddress,
        value: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct Approval {
        #[key] owner:   ContractAddress,
        #[key] spender: ContractAddress,
        value: u256,
    }

    #[abi(embed_v0)]
    impl MockWBTCImpl of super::IMockWBTC<ContractState> {
        fn name(self: @ContractState) -> felt252       { 'Wrapped Bitcoin' }
        fn symbol(self: @ContractState) -> felt252     { 'WBTC' }
        fn decimals(self: @ContractState) -> u8        { 8 }
        fn total_supply(self: @ContractState) -> u256  { self.total_supply.read() }

        fn balance_of(self: @ContractState, owner: ContractAddress) -> u256 {
            self.balances.entry(owner).read()
        }

        fn allowance(self: @ContractState, owner: ContractAddress, spender: ContractAddress) -> u256 {
            self.allowances.entry(owner).entry(spender).read()
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            let owner = get_caller_address();
            self.allowances.entry(owner).entry(spender).write(amount);
            self.emit(Approval { owner, spender, value: amount });
            true
        }

        fn transfer(ref self: ContractState, to: ContractAddress, amount: u256) -> bool {
            let from = get_caller_address();
            let bal = self.balances.entry(from).read();
            assert(bal >= amount, 'insufficient balance');
            self.balances.entry(from).write(bal - amount);
            self.balances.entry(to).write(self.balances.entry(to).read() + amount);
            self.emit(Transfer { from, to, value: amount });
            true
        }

        fn transfer_from(
            ref self: ContractState,
            from: ContractAddress,
            to: ContractAddress,
            amount: u256,
        ) -> bool {
            let caller = get_caller_address();
            let allowed = self.allowances.entry(from).entry(caller).read();
            assert(allowed >= amount, 'insufficient allowance');
            self.allowances.entry(from).entry(caller).write(allowed - amount);
            let bal = self.balances.entry(from).read();
            assert(bal >= amount, 'insufficient balance');
            self.balances.entry(from).write(bal - amount);
            self.balances.entry(to).write(self.balances.entry(to).read() + amount);
            self.emit(Transfer { from, to, value: amount });
            true
        }

        // Public mint — test use only
        fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
            self.total_supply.write(self.total_supply.read() + amount);
            self.balances.entry(to).write(self.balances.entry(to).read() + amount);
            let zero: ContractAddress = 0.try_into().unwrap();
            self.emit(Transfer { from: zero, to, value: amount });
        }
    }
}

#[starknet::interface]
trait IMockWBTC<TContractState> {
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, owner: starknet::ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: starknet::ContractAddress, spender: starknet::ContractAddress) -> u256;
    fn approve(ref self: TContractState, spender: starknet::ContractAddress, amount: u256) -> bool;
    fn transfer(ref self: TContractState, to: starknet::ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TContractState, from: starknet::ContractAddress, to: starknet::ContractAddress, amount: u256) -> bool;
    fn mint(ref self: TContractState, to: starknet::ContractAddress, amount: u256);
}
