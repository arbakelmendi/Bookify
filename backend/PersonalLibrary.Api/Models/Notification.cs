namespace PersonalLibrary.Api.Models;

public class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // e.g. "FRIEND_REQUEST_RECEIVED", "FRIEND_REQUEST_ACCEPTED", "RECOMMENDATION_RECEIVED"
    public string Type { get; set; } = null!;

    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;

    // optional references
    public int? FriendRequestId { get; set; }
    public int? RecommendationId { get; set; }
    public int? FromUserId { get; set; }
    public int? BookId { get; set; }

    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
}
