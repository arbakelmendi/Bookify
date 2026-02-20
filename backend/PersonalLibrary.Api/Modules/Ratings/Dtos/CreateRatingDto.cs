namespace PersonalLibrary.Api.Modules.Ratings.Dtos;

public class SetRatingDto
{
    public int BookId { get; set; }
    public int Value { get; set; }
}