using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddChatAndFriendshipConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Deduplicate Friendships before creating normalized unique index (preserving Accepted status over Pending)
            migrationBuilder.Sql(@"
                SET lock_timeout = '5s';
                DELETE FROM public.""Friendships"" f1
                WHERE EXISTS (
                    SELECT 1 FROM public.""Friendships"" f2
                    WHERE LEAST(f1.""RequesterId"", f1.""AddresseeId"") = LEAST(f2.""RequesterId"", f2.""AddresseeId"")
                      AND GREATEST(f1.""RequesterId"", f1.""AddresseeId"") = GREATEST(f2.""RequesterId"", f2.""AddresseeId"")
                      AND (
                          (f2.""Status"" = 1 AND f1.""Status"" != 1)
                          OR (
                              (f1.""Status"" = 1) = (f2.""Status"" = 1)
                              AND f1.""Id"" > f2.""Id""
                          )
                      )
                );
            ");

            // 2. Create Unique Normalized Pair Index on Friendships concurrently
            migrationBuilder.Sql(@"
                CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS ""IX_Friendships_Normalized_Pair""
                ON public.""Friendships"" (LEAST(""RequesterId"", ""AddresseeId""), GREATEST(""RequesterId"", ""AddresseeId""));
            ", suppressTransaction: true);

            // 3. Create Private Chat History Index concurrently
            migrationBuilder.Sql(@"
                CREATE INDEX CONCURRENTLY IF NOT EXISTS ""IX_ChatMessages_Receiver_Sender_Timestamp""
                ON public.""ChatMessages"" (""ReceiverId"", ""SenderId"", ""Timestamp"" DESC);
            ", suppressTransaction: true);

            // 4. Create Global Chat History Partial Index concurrently
            migrationBuilder.Sql(@"
                CREATE INDEX CONCURRENTLY IF NOT EXISTS ""IX_ChatMessages_Global_Timestamp""
                ON public.""ChatMessages"" (""Timestamp"" DESC)
                WHERE ""ReceiverId"" IS NULL;
            ", suppressTransaction: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP INDEX CONCURRENTLY IF EXISTS public.""IX_Friendships_Normalized_Pair"";", suppressTransaction: true);
            migrationBuilder.Sql(@"DROP INDEX CONCURRENTLY IF EXISTS public.""IX_ChatMessages_Receiver_Sender_Timestamp"";", suppressTransaction: true);
            migrationBuilder.Sql(@"DROP INDEX CONCURRENTLY IF EXISTS public.""IX_ChatMessages_Global_Timestamp"";", suppressTransaction: true);
        }
    }
}
