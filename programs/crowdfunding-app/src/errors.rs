use anchor_lang::prelude::*;

#[error_code]
pub enum CampaignError {
    #[msg("Cannot initialize, name too long")]
    NameTooLong,
    #[msg("Cannot initialize, description too long")]
    DescriptionTooLong,
    #[msg("Do not have authority to withdraw")]
    NoWithdrawAuthority,
    // #[msg("Maximum number of Dislikes Reached")]
    // MaxDislikesReached,
    // #[msg("Minimum number of Likes Reached")]
    // MinLikesReached,
    // #[msg("Minimum number of Dislikes Reached")]
    // MinDislikesReached,
    // #[msg("Comment too Long")]
    // CommentTooLong,
}
