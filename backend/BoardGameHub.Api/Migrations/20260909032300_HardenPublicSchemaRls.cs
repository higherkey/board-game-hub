using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class HardenPublicSchemaRls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
                ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
                ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;

                REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
                REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
                REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

                ALTER TABLE public.""AspNetRoles"" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""AspNetUsers"" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""AspNetRoleClaims"" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""AspNetUserClaims"" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""AspNetUserLogins"" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""AspNetUserRoles"" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""AspNetUserTokens"" ENABLE ROW LEVEL SECURITY;

                ALTER TABLE public.""ChatMessages"" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""Friendships"" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""GameSessions"" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""GameSessionPlayers"" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""Games"" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""__EFMigrationsHistory"" ENABLE ROW LEVEL SECURITY;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE public.""AspNetRoles"" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""AspNetUsers"" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""AspNetRoleClaims"" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""AspNetUserClaims"" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""AspNetUserLogins"" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""AspNetUserRoles"" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""AspNetUserTokens"" DISABLE ROW LEVEL SECURITY;

                ALTER TABLE public.""ChatMessages"" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""Friendships"" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""GameSessions"" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""GameSessionPlayers"" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public.""Games"" DISABLE ROW LEVEL SECURITY;
            ");
        }
    }
}
