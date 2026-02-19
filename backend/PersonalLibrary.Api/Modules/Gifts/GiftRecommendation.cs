namespace PersonalLibrary.Api.Modules.Gifts;

public enum GiftStatus
{
    Pending = 0,
    Accepted = 1,
    Declined = 2,
    Cancelled = 3
}

public class GiftRecommendation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Kush e dërgon rekomandimin
    public Guid SenderId { get; set; }

    // Kush e pranon
    public Guid ReceiverId { get; set; }

    // Libri që rekomandohet
    public Guid BookId { get; set; }

    // Mesazh opsional
    public string? Message { get; set; }

    // Statusi i gift-it
    public GiftStatus Status { get; set; } = GiftStatus.Pending;

    // Data e krijimit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Kur pranohet/refuzohet/anulohet
    public DateTime? RespondedAt { get; set; }

    // A e ka parë receiver-i
    public bool SeenByReceiver { get; set; } = false;
}
