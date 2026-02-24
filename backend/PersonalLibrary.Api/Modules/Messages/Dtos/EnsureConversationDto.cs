namespace PersonalLibrary.Api.Modules.Messages.Dtos;

public record EnsureConversationDto(
    int ConversationId,
    int FriendId,
    string FriendUsername
);

