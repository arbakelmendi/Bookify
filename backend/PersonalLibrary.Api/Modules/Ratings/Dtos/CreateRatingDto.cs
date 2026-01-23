namespace PersonalLibrary.Api.Modules.Ratings.Dtos;

public class CreateRatingDto
{
    public int BookId { get; set; }
    public int Rating { get; set; } // 1-5
}
