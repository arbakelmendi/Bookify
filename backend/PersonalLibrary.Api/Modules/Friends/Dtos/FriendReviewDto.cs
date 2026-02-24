namespace PersonalLibrary.Api.Modules.Friends.Dtos;

public record FriendReviewDto(
    int Id,
    int BookId,
    string BookTitle,
    string CoverImageUrl,
    string Text,
    int Rating,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
