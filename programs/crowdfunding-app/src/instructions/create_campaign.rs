use anchor_lang::prelude::*;

use crate::{errors::CampaignError, states::{Campaign, CAMPAIGN_SEED, DESCRIPTION_LENGTH, NAME_LENGTH}};

pub fn create_campaign(ctx: Context<CreateCampaign>, name: String, description: String, funding_goal : u64) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    
    require!(
        name.as_bytes().len() <= NAME_LENGTH,
        CampaignError::NameTooLong
    );

    require!(
        description.as_bytes().len() <= DESCRIPTION_LENGTH,
        CampaignError::DescriptionTooLong
    );
    

    // NOTICE how we copy data from String into bytearray
    // firstly we create empty bytearray of predefined length (depends on the String we want to
    // save inside)
    let mut name_data = [0u8; NAME_LENGTH];
    // then we copy contents of the String into the bytearray
    name_data[..name.as_bytes().len()].copy_from_slice(name.as_bytes());
    // lastly we assign the bytearray into the bytearray stored within the Campaign Account
    campaign.name = name_data;

    // Same steps as above but now for description string
    let mut description_data = [0u8; DESCRIPTION_LENGTH];
    description_data[..description.as_bytes().len()].copy_from_slice(description.as_bytes());
    campaign.description = description_data;
    

    //TODO implement:  campaign.funding_deadline = funding_deadline;
    
    campaign.funding_goal = funding_goal;
    campaign.owner = *ctx.accounts.user.key;
    campaign.total_funding = 0;

    campaign.name_length = name.as_bytes().len() as u8;

    campaign.bump = ctx.bumps.campaign;
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String, description: String, funding_goal: u8)]
pub struct CreateCampaign<'info> {
    #[account(init, payer=user, space= 8 + Campaign::LEN, seeds=[CAMPAIGN_SEED.as_bytes(), user.key().as_ref(), name.as_bytes()], bump)] //name.as_bytes()
    pub campaign : Account<'info, Campaign>,
    #[account(mut)]
    pub user : Signer<'info>,
    pub system_program: Program<'info, System>,
}