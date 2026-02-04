namespace PersonalLibrary.Api.Modules.Recommendations.Dtos;

public record RecommendationDto(
    int Id,
    int FromUserId,
    int ToUserId,
    int BookId,
    string? Message,
    DateTime CreatedAt
);
