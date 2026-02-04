namespace PersonalLibrary.Api.Modules.Recommendations.Dtos;

public class SendRecommendationDto
{
    public int ToUserId { get; set; }
    public int BookId { get; set; }
    public string? Message { get; set; }
}
