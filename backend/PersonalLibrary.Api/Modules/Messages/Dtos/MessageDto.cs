namespace PersonalLibrary.Api.Modules.Messages.Dtos;

public record MessageDto(
    int Id,
    int SenderId,
    int ReceiverId,
    string Content,
    DateTime SentAt,
    bool IsRead
);
