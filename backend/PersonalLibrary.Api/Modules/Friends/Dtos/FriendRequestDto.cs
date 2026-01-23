namespace PersonalLibrary.Api.Modules.Friends.Dtos;

public record FriendRequestDto(
    int Id,
    int SenderId,
    int ReceiverId,
    string Status,
    DateTime CreatedAt,
    DateTime? RespondedAt
);