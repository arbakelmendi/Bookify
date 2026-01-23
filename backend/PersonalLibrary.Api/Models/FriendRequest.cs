namespace PersonalLibrary.Api.Models;

public class FriendRequest
{
    public int Id { get; set; }

    public int SenderId { get; set; }
    public int ReceiverId { get; set; }

    // "Pending" | "Accepted" | "Rejected"
    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }

    // Optional navigation props (nëse s’do, mundesh me i hjek)
    public User? Sender { get; set; }
    public User? Receiver { get; set; }
}