#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec, log};

#[contracttype]
#[derive(Clone, Debug)]
pub struct Campaign {
    pub id: u64,
    pub creator: Address,
    pub title: String,
    pub goal: i128,
    pub raised: i128,
    pub deadline: u64,
    pub claimed: bool,
}

#[contracttype]
pub enum DataKey {
    Campaign(u64),
    CampaignCount,
    Contribution(u64, Address),
}

#[contract]
pub struct CampaignContract;

#[contractimpl]
impl CampaignContract {
    /// Create a new crowdfunding campaign
    pub fn create_campaign(
        env: Env,
        creator: Address,
        title: String,
        goal: i128,
        deadline: u64,
    ) -> u64 {
        creator.require_auth();
        let count: u64 = env.storage().instance().get(&DataKey::CampaignCount).unwrap_or(0);
        let id = count + 1;
        let campaign = Campaign {
            id,
            creator: creator.clone(),
            title: title.clone(),
            goal,
            raised: 0,
            deadline,
            claimed: false,
        };
        env.storage().instance().set(&DataKey::Campaign(id), &campaign);
        env.storage().instance().set(&DataKey::CampaignCount, &id);
        // Emit creation event
        env.events().publish((symbol_short!("created"), creator), (id, title, goal, deadline));
        id
    }

    /// Contribute XLM to a campaign
    pub fn contribute(env: Env, campaign_id: u64, contributor: Address, amount: i128) {
        contributor.require_auth();
        let mut campaign: Campaign = env.storage().instance()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");
        assert!(env.ledger().timestamp() < campaign.deadline, "Campaign expired");
        assert!(amount > 0, "Amount must be positive");
        campaign.raised += amount;
        let prev: i128 = env.storage().instance()
            .get(&DataKey::Contribution(campaign_id, contributor.clone()))
            .unwrap_or(0);
        env.storage().instance().set(&DataKey::Contribution(campaign_id, contributor.clone()), &(prev + amount));
        env.storage().instance().set(&DataKey::Campaign(campaign_id), &campaign);
        // Emit contribution event for real-time streaming
        env.events().publish(
            (symbol_short!("contrib"), contributor.clone()),
            (campaign_id, amount, campaign.raised)
        );
        log!(&env, "Contribution: campaign={}, amount={}, total={}", campaign_id, amount, campaign.raised);
    }

    /// Creator claims funds when goal is met
    pub fn claim(env: Env, campaign_id: u64) {
        let mut campaign: Campaign = env.storage().instance()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");
        campaign.creator.require_auth();
        assert!(campaign.raised >= campaign.goal, "Goal not met");
        assert!(!campaign.claimed, "Already claimed");
        campaign.claimed = true;
        env.storage().instance().set(&DataKey::Campaign(campaign_id), &campaign);
        env.events().publish((symbol_short!("claimed"), campaign.creator.clone()), (campaign_id, campaign.raised));
    }

    /// Get campaign details
    pub fn get_campaign(env: Env, campaign_id: u64) -> Campaign {
        env.storage().instance()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found")
    }

    /// Get total campaigns
    pub fn get_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::CampaignCount).unwrap_or(0)
    }

    /// Get contribution amount for a contributor
    pub fn get_contribution(env: Env, campaign_id: u64, contributor: Address) -> i128 {
        env.storage().instance()
            .get(&DataKey::Contribution(campaign_id, contributor))
            .unwrap_or(0)
    }
}
