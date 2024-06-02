use anchor_lang::prelude::*;

pub const CAMPAIGN_SEED: &str = "campaign";
pub const NAME_LENGTH: usize = 32;
pub const DESCRIPTION_LENGTH: usize = 500;

//TODO implement funding_deadline as a date
#[account]
pub struct Campaign {
    pub name: [u8; NAME_LENGTH],
    pub name_length: u8,
    pub description: [u8; DESCRIPTION_LENGTH],
    pub funding_goal: u64,
    pub total_funding: u64,
    pub owner: Pubkey,
    pub bump: u8,
}

impl Campaign {
    // Pubkey + [u8; NAME_LENGTH] + [u8; DESCRIPTION_LENGTH] + u64 + u64 + u64 + u8
    pub const LEN: usize = 32 + NAME_LENGTH + DESCRIPTION_LENGTH + 8 + 8 + 8 + 1;
}