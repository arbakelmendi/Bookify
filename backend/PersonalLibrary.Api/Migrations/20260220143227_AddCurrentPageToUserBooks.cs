using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalLibrary.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCurrentPageToUserBooks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('UserBooks', 'CurrentPage') IS NULL
                BEGIN
                    ALTER TABLE [UserBooks]
                    ADD [CurrentPage] int NOT NULL
                    CONSTRAINT [DF_UserBooks_CurrentPage] DEFAULT 1;
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('UserBooks', 'CurrentPage') IS NOT NULL
                BEGIN
                    DECLARE @ConstraintName nvarchar(128);
                    SELECT @ConstraintName = dc.name
                    FROM sys.default_constraints dc
                    INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
                    INNER JOIN sys.tables t ON t.object_id = c.object_id
                    WHERE t.name = 'UserBooks' AND c.name = 'CurrentPage';

                    IF @ConstraintName IS NOT NULL
                    BEGIN
                        EXEC('ALTER TABLE [UserBooks] DROP CONSTRAINT [' + @ConstraintName + ']');
                    END

                    ALTER TABLE [UserBooks] DROP COLUMN [CurrentPage];
                END
                """);
        }
    }
}
