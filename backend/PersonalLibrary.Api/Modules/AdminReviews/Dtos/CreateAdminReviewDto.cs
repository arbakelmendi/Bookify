namespace PersonalLibrary.Api.Modules.AdminReviews.Dtos;

public class CreateAdminReviewDto
{
    public int BookId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
}
