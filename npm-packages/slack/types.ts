export interface ISlackConversationListRequestBody {
    team_id?: string;
    types?: string; // comma seperated list of TSlackChannelType
    limit?: number;
    cursor?: string;
    exclude_archived?: boolean;
}
  