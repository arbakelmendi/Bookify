namespace PersonalLibrary.Api.Modules.Users.Dtos;

public record UserSearchResultDto(
    int Id,
    string Email,
    string Username,
    string Relationship,     // "NONE" | "INCOMING" | "OUTGOING" | "FRIEND"
    int? RequestId           // nëse INCOMING/OUTGOING, id e friendRequest
);
