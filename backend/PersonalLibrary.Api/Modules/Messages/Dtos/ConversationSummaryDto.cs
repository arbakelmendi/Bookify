namespace PersonalLibrary.Api.Modules.Messages.Dtos;

public record ConversationSummaryDto(
    int FriendId,
    string FriendUsername,
    string? LastMessage,
    DateTime? LastMessageAt,
    int UnreadCount
);
