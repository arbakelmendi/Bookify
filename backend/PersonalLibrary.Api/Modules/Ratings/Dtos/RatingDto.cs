namespace PersonalLibrary.Api.Modules.Ratings.Dtos;

public record RatingDto(
    int Id,
    int UserId,
    int BookId,
    int Rating
);
