#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, log};

#[contracttype]
pub enum TreasuryKey {
    Balance(Address),
    TotalLocked,
}

#[contract]
pub struct TreasuryContract;

/// Treasury contract — called by Campaign contract for fund custody
/// Demonstrates inter-contract communication pattern
#[contractimpl]
impl TreasuryContract {
    /// Lock funds on behalf of a campaign
    pub fn lock_funds(env: Env, campaign_id: u64, contributor: Address, amount: i128) {
        assert!(amount > 0, "Amount must be positive");
        let prev: i128 = env.storage().instance()
            .get(&TreasuryKey::Balance(contributor.clone()))
            .unwrap_or(0);
        env.storage().instance().set(&TreasuryKey::Balance(contributor.clone()), &(prev + amount));
        let total: i128 = env.storage().instance()
            .get(&TreasuryKey::TotalLocked)
            .unwrap_or(0);
        env.storage().instance().set(&TreasuryKey::TotalLocked, &(total + amount));
        env.events().publish((symbol_short!("locked"), contributor), (campaign_id, amount));
        log!(&env, "Treasury locked: campaign={}, amount={}", campaign_id, amount);
    }

    /// Release funds to campaign creator
    pub fn release_funds(env: Env, recipient: Address, amount: i128) {
        recipient.require_auth();
        let total: i128 = env.storage().instance()
            .get(&TreasuryKey::TotalLocked)
            .unwrap_or(0);
        assert!(total >= amount, "Insufficient locked funds");
        env.storage().instance().set(&TreasuryKey::TotalLocked, &(total - amount));
        env.events().publish((symbol_short!("released"), recipient.clone()), amount);
        log!(&env, "Treasury released: recipient={:?}, amount={}", recipient, amount);
    }

    /// Refund contributor if campaign failed
    pub fn refund(env: Env, contributor: Address) -> i128 {
        contributor.require_auth();
        let balance: i128 = env.storage().instance()
            .get(&TreasuryKey::Balance(contributor.clone()))
            .unwrap_or(0);
        assert!(balance > 0, "Nothing to refund");
        env.storage().instance().set(&TreasuryKey::Balance(contributor.clone()), &0i128);
        env.events().publish((symbol_short!("refunded"), contributor), balance);
        balance
    }

    /// Get locked balance for contributor
    pub fn get_balance(env: Env, contributor: Address) -> i128 {
        env.storage().instance()
            .get(&TreasuryKey::Balance(contributor))
            .unwrap_or(0)
    }

    pub fn get_total_locked(env: Env) -> i128 {
        env.storage().instance().get(&TreasuryKey::TotalLocked).unwrap_or(0)
    }
}
