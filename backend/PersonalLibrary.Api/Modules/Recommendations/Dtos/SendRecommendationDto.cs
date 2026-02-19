namespace PersonalLibrary.Api.Modules.Recommendations.Dtos;

public class SendRecommendationDto
{
    public string ToUsername { get; set; } = string.Empty;

    public int BookId { get; set; }

    public string? Message { get; set; }
}
