using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddActiveRoomsPersistence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ActiveRooms",
                columns: table => new
                {
                    RoomCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    GameType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    State = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    SchemaVersion = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    Revision = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                    RoomEnvelopeJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActiveRooms", x => x.RoomCode);
                });

            migrationBuilder.CreateIndex(
                name: "idx_active_rooms_lookup",
                table: "ActiveRooms",
                columns: new[] { "State", "ExpiresAt", "UpdatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActiveRooms");
        }
    }
}
