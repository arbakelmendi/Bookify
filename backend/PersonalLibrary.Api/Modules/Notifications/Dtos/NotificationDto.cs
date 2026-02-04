namespace PersonalLibrary.Api.Modules.Notifications.Dtos;

public record NotificationDto(
    int Id,
    string Type,
    string Title,
    string Message,
    bool IsRead,
    DateTime CreatedAt,
    int? FriendRequestId,
    int? RecommendationId,
    int? FromUserId,
    int? BookId
);
