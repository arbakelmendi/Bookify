namespace PersonalLibrary.Api.Modules.Reviews.Dtos;

public record ReviewDto(
    int Id,
    int UserId,
    int BookId,
    string UserName,
    string Text,
    int RatingValue,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
