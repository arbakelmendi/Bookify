namespace PersonalLibrary.Api.Modules.Friends.Dtos;

public record FriendRequestViewDto(
    int Id,
    int SenderId,
    string SenderEmail,
    string SenderUsername,
    int ReceiverId,
    string ReceiverEmail,
    string ReceiverUsername,
    string Status,
    DateTime CreatedAt,
    DateTime? RespondedAt
);
