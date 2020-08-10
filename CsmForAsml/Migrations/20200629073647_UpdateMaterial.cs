using Microsoft.EntityFrameworkCore.Migrations;

namespace CsmForAsml.Migrations
{
    public partial class UpdateMaterial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PriceFromVendor",
                table: "MaterialNeedCal",
                type: "money",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PriceToUser",
                table: "MaterialNeedCal",
                type: "money",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PriceFromVendor",
                table: "MaterialNeedCal");

            migrationBuilder.DropColumn(
                name: "PriceToUser",
                table: "MaterialNeedCal");
        }
    }
}
