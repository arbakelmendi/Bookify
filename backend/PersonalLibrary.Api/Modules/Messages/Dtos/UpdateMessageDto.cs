using System.ComponentModel.DataAnnotations;

namespace PersonalLibrary.Api.Modules.Messages.Dtos;

public record UpdateMessageDto(
    [Required, MinLength(1), MaxLength(2000)]
    string Content
);
