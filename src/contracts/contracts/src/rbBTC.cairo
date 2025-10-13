// ERC20 básico para representar participación en el Vault BTC (rbBTC)

#[starknet::contract]
mod rb_btc_token {
    use starknet::{ContractAddress, get_caller_address};
    use array::ArrayTrait;
    use core::traits::Into;
    use starknet::storage::Map;

    #[storage]
    struct Storage {
        name: felt252,
        symbol: felt252,
        decimals: u8,
        total_supply: u256,
        balances: Map<ContractAddress, u256>,
        allowances: Map<(ContractAddress, ContractAddress), u256>,
        vault: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    struct Event {
        from: ContractAddress,
        to: ContractAddress,
        amount: u256
    }

    #[constructor]
    fn constructor(ref self: ContractState, vault: ContractAddress) {
        self.name.write('Rebalancing BTC');
        self.symbol.write('rbBTC');
        self.decimals.write(8);
        self.total_supply.write(0);
        self.vault.write(vault);
    }

    #[external(v0)]
    fn name(self: @ContractState) -> felt252 {
        self.name.read()
    }

    #[external(v0)]
    fn symbol(self: @ContractState) -> felt252 {
        self.symbol.read()
    }

    #[external(v0)]
    fn decimals(self: @ContractState) -> u8 {
        self.decimals.read()
    }

    #[external(v0)]
    fn total_supply(self: @ContractState) -> u256 {
        self.total_supply.read()
    }

    #[external(v0)]
    fn balance_of(self: @ContractState, owner: ContractAddress) -> u256 {
        self.balances.read(owner)
    }

    #[external(v0)]
    fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
        let sender = get_caller_address();
        let from_balance = self.balances.read(sender);
        assert!(from_balance >= amount, "insufficient-balance");
        self.balances.write(sender, from_balance - amount);

        let to_balance = self.balances.read(recipient);
        self.balances.write(recipient, to_balance + amount);

        self.emit(Event { from: sender, to: recipient, amount });
        true
    }

    #[external(v0)]
    fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
        let owner = get_caller_address();
        self.allowances.write((owner, spender), amount);
        self.emit(Event { from: owner, to: spender, amount });
        true
    }

    #[external(v0)]
    fn transfer_from(ref self: ContractState, from: ContractAddress, to: ContractAddress, amount: u256) -> bool {
        let spender = get_caller_address();
        let current_allowance = self.allowances.read((from, spender));
        assert!(current_allowance >= amount, "allowance-too-low");
        self.allowances.write((from, spender), current_allowance - amount);

        let from_balance = self.balances.read(from);
        assert!(from_balance >= amount, "insufficient-balance");
        self.balances.write(from, from_balance - amount);

        let to_balance = self.balances.read(to);
        self.balances.write(to, to_balance + amount);

        self.emit(Event { from, to, amount });
        true
    }

    // Mint solo permitida por el contrato Vault
    #[external(v0)]
    fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
        let caller = get_caller_address();
        assert!(caller == self.vault.read(), "only-vault-can-mint");

        let current = self.balances.read(to);
        self.balances.write(to, current + amount);
        self.total_supply.write(self.total_supply.read() + amount);

        self.emit(Event { from: 0.try_into().unwrap(), to, amount });
    }

    // Burn solo permitida por el contrato Vault
    #[external(v0)]
    fn burn(ref self: ContractState, from: ContractAddress, amount: u256) {
        let caller = get_caller_address();
        assert!(caller == self.vault.read(), "only-vault-can-burn");

        let current = self.balances.read(from);
        assert!(current >= amount, "insufficient-balance");
        self.balances.write(from, current - amount);
        self.total_supply.write(self.total_supply.read() - amount);

        self.emit(Event { from, to: 0.try_into().unwrap(), amount });
    }
}
