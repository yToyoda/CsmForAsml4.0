 using System;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace CsmForAsml.Models
{
    public partial class CsmForAsml2Context : DbContext
    {
        public CsmForAsml2Context()
        {
        }

        public CsmForAsml2Context(DbContextOptions<CsmForAsml2Context> options)
            : base(options)
        {
        }

        public virtual DbSet<CalDate> CalDate { get; set; }
        public virtual DbSet<CalInProcess> CalInProcess { get; set; }
        public virtual DbSet<CalInProcessBU> CalInProcessBackup { get; set; }
        public virtual DbSet<HolidayEntry> Holidays { get; set; }
        public virtual DbSet<Location> Location { get; set; }
        public virtual DbSet<MaterialNeedCal> MaterialNeedCal { get; set; }
        public virtual DbSet<MigrationHistory> MigrationHistory { get; set; }
        public virtual DbSet<ToolInventory> ToolInventory { get; set; }

        CalDateRepository _calDateRepostiry;

        CalInProcessRepository _calInProcessRepository;

        CalInProcessBURepository _calInProcessBURepository;

        HolidayRepository _holidayRepository;

        LocationRepository _locationRepository;

        MaterialNeedCalRepository _materialNeedCalRepository;

        ToolInventoryRepository _toolInventoryRepository;

        public CalDateRepository CalDateRepository {
            get { return _calDateRepostiry ?? (_calDateRepostiry = new CalDateRepository(this)); }
        }

        public CalInProcessRepository CalInProcessRepository {
            get { return _calInProcessRepository ?? (_calInProcessRepository = new CalInProcessRepository(this)); }
        }

        public CalInProcessBURepository CalInProcessBURepository {
            get { return _calInProcessBURepository ?? (_calInProcessBURepository = new CalInProcessBURepository(this)); }
        }

        public HolidayRepository HolidayRepository {
            get { return _holidayRepository ?? (_holidayRepository = new HolidayRepository(this)); }
        }

        public LocationRepository LocationRepository {
            get { return _locationRepository ?? (_locationRepository = new LocationRepository(this)); }
        }

        //public IRepository<MaterialNeedCal> MaterialNeedCalRepository {
        public MaterialNeedCalRepository MaterialNeedCalRepository { 
            get { return _materialNeedCalRepository ?? (_materialNeedCalRepository = new MaterialNeedCalRepository(this)); }
        }

        public ToolInventoryRepository ToolInventoryRepository {
            get { return _toolInventoryRepository ?? (_toolInventoryRepository = new ToolInventoryRepository(this)); }
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                var connectionString = Startup.AppSettings["CsmForAsml2"];
                optionsBuilder.UseSqlServer(connectionString);
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
 
            modelBuilder.Entity<CalDate>(entity =>
            {
                entity.Property(e => e.CalDate1)
                    .HasColumnName("Cal Date")
                    .HasColumnType("date");

                entity.Property(e => e.CalStatus)
                    .HasColumnName("Cal Status")
                    .HasMaxLength(50);

                entity.Property(e => e.PdfFileName)
                    .HasColumnName("PDF File Name")
                    .HasMaxLength(50);

                entity.Property(e => e.Serial)
                    .IsRequired()
                    .HasMaxLength(20);
            });

            modelBuilder.Entity<CalInProcess>(entity =>
            {
                entity.Property(e => e.CalDate)
                    .HasColumnName("Cal_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.CalResult).HasColumnName("Cal_Result");

                entity.Property(e => e.CcReceiveDate)
                    .HasColumnName("CC_Receive_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.CcUploadDate)
                    .HasColumnName("CC_Upload_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.PlanedShipDate)
                    .HasColumnName("Planed_ShipDate")
                    .HasColumnType("datetime");

                entity.Property(e => e.Plant).HasMaxLength(5);

                entity.Property(e => e.RegisteredDate)
                    .HasColumnName("Registered_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.SerialNumber)
                    .IsRequired()
                    .HasColumnName("Serial_Number")
                    .HasMaxLength(50);

                entity.Property(e => e.Tat).HasColumnName("TAT");

                entity.Property(e => e.TatStatus).HasMaxLength(20);

                entity.Property(e => e.UserReceiveDate)
                    .HasColumnName("User_Receive_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.UserShipDate)
                    .HasColumnName("User_Ship_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.VenComment)
                    .HasColumnName("Ven_Comment")
                    .HasMaxLength(50);

                entity.Property(e => e.VenReceiveDate)
                    .HasColumnName("Ven_Receive_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.VenShipDate)
                    .HasColumnName("Ven_ShipDate")
                    .HasColumnType("datetime");
            });

            modelBuilder.Entity<CalInProcessBU>(entity => {
                entity.Property(e => e.CalDate)
                    .HasColumnName("Cal_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.CalResult).HasColumnName("Cal_Result");

                entity.Property(e => e.CcReceiveDate)
                    .HasColumnName("CC_Receive_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.CcUploadDate)
                    .HasColumnName("CC_Upload_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.PlanedShipDate)
                    .HasColumnName("Planed_ShipDate")
                    .HasColumnType("datetime");

                entity.Property(e => e.Plant).HasMaxLength(5);

                entity.Property(e => e.RegisteredDate)
                    .HasColumnName("Registered_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.SerialNumber)
                    .IsRequired()
                    .HasColumnName("Serial_Number")
                    .HasMaxLength(50);

                entity.Property(e => e.Tat).HasColumnName("TAT");

                entity.Property(e => e.TatStatus).HasMaxLength(20);

                entity.Property(e => e.UserReceiveDate)
                    .HasColumnName("User_Receive_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.UserShipDate)
                    .HasColumnName("User_Ship_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.VenComment)
                    .HasColumnName("Ven_Comment")
                    .HasMaxLength(50);

                entity.Property(e => e.VenReceiveDate)
                    .HasColumnName("Ven_Receive_Date")
                    .HasColumnType("datetime");

                entity.Property(e => e.VenShipDate)
                    .HasColumnName("Ven_ShipDate")
                    .HasColumnType("datetime");
            });


            modelBuilder.Entity<HolidayEntry>(entity =>
            {
                entity.HasKey(e => e.Date)
                    .HasName("PK_dbo.Holidays");

                entity.Property(e => e.Date).HasColumnType("datetime");

                entity.Property(e => e.HolidayName).HasMaxLength(50);
            });

            modelBuilder.Entity<Location>(entity =>
            {
                entity.HasKey(e => e.Plant)
                    .HasName("PK_dbo.Location");

                entity.Property(e => e.Plant)
                    .HasMaxLength(10)
                    .IsUnicode(false);

                entity.Property(e => e.Location1)
                    .HasColumnName("Location")
                    .HasMaxLength(20);
            });

            modelBuilder.Entity<MaterialNeedCal>(entity =>
            {
                entity.HasKey(e => e.Material)
                    .HasName("PK_dbo.MaterialNeedCal");

                entity.Property(e => e.Material)
                    .HasMaxLength(16)
                    .IsUnicode(false);

                entity.Property(e => e.AddRemove).HasMaxLength(10);

                entity.Property(e => e.CalInterval).HasColumnName("Cal Interval");

                entity.Property(e => e.CalPlace)
                    .HasColumnName("Cal Place")
                    .HasMaxLength(16);

                entity.Property(e => e.CalVendor)
                    .HasColumnName("Cal Vendor")
                    .HasMaxLength(50);

                entity.Property(e => e.ChangeDate).HasColumnType("date");

                entity.Property(e => e.Instruction).HasMaxLength(4000);

                entity.Property(e => e.MaterialDescription)
                    .HasColumnName("Material Description")
                    .HasMaxLength(4000);

                entity.Property(e => e.PMaker)
                    .HasColumnName("P.Maker")
                    .HasMaxLength(50);

                entity.Property(e => e.PModel)
                    .HasColumnName("P.Model")
                    .HasMaxLength(50);

                entity.Property(e => e.PName)
                    .HasColumnName("P.Name")
                    .HasMaxLength(50);

                entity.Property(e => e.SafetyInterval).HasColumnName("Safety Interval");

                entity.Property(e => e.PriceFromVendor).HasColumnType("money");

                entity.Property(e => e.PriceToUser).HasColumnType("money");

            });

            modelBuilder.Entity<MigrationHistory>(entity =>
            {
                entity.HasKey(e => new { e.MigrationId, e.ContextKey })
                    .HasName("PK_dbo.__MigrationHistory");

                entity.ToTable("__MigrationHistory");

                entity.Property(e => e.MigrationId).HasMaxLength(150);

                entity.Property(e => e.ContextKey).HasMaxLength(300);

                entity.Property(e => e.Model).IsRequired();

                entity.Property(e => e.ProductVersion)
                    .IsRequired()
                    .HasMaxLength(32);
            });

            modelBuilder.Entity<ToolInventory>(entity =>
            {
                entity.HasKey(e => e.SerialNumber)
                    .HasName("PK_dbo.ToolInventory");

                entity.Property(e => e.SerialNumber)
                    .HasColumnName("Serial Number")
                    .HasMaxLength(20)
                    .IsUnicode(false);

                entity.Property(e => e.CalDue)
                    .HasColumnName("Cal Due")
                    .HasColumnType("date");

                entity.Property(e => e.CalStatus)
                    .HasColumnName("Cal Status")
                    .HasMaxLength(50);

                entity.Property(e => e.Comment).HasMaxLength(4000);

                entity.Property(e => e.Description).HasMaxLength(4000);

                entity.Property(e => e.LatestCalDate)
                    .HasColumnName("Latest Cal Date")
                    .HasColumnType("date");

                entity.Property(e => e.LatestSafetyDate)
                    .HasColumnName("Latest Safety Date")
                    .HasColumnType("date");

                entity.Property(e => e.Machine).HasMaxLength(20);

                entity.Property(e => e.Material)
                    .HasMaxLength(16)
                    .IsUnicode(false);

                entity.Property(e => e.PSN)
                    .HasColumnName("P.S/N")
                    .HasMaxLength(50);

                entity.Property(e => e.Plant)
                    .HasMaxLength(6)
                    .IsUnicode(false);

                entity.Property(e => e.RemovedDate)
                    .HasColumnName("Removed Date")
                    .HasColumnType("date");

                entity.Property(e => e.Room).HasMaxLength(16);

                entity.Property(e => e.SafetyDue)
                    .HasColumnName("Safety Due")
                    .HasColumnType("date");

                entity.Property(e => e.SortField)
                    .HasColumnName("Sort field")
                    .HasMaxLength(50);

                entity.Property(e => e.StoreLocation)
                    .HasColumnName("Store Location")
                    .HasMaxLength(10);

                entity.Property(e => e.SuperordEquip).HasMaxLength(12);

                entity.Property(e => e.SystemStatus)
                    .HasColumnName("System status")
                    .HasMaxLength(50);

                entity.Property(e => e.ToolkitMachine)
                    .HasColumnName("Toolkit Machine")
                    .HasMaxLength(20);

                entity.Property(e => e.ToolkitSloc)
                    .HasColumnName("Toolkit sloc")
                    .HasMaxLength(20);

                entity.Property(e => e.UpdatedDate)
                    .HasColumnName("Updated Date")
                    .HasColumnType("date");

                entity.Property(e => e.UserStatus)
                    .HasColumnName("User status")
                    .HasMaxLength(50);
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
