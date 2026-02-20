namespace PersonalLibrary.Api.Modules.AdminReviews.Dtos;

public record AdminReviewDto(
    int Id,
    int UserId,
    string Username,
    string Email,
    int BookId,
    string BookTitle,
    int Rating,
    string? Comment,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

