using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using CsmForAsml.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;


namespace CsmForAsml.Controllers {
    //[Authorize]
    [Authorize (Roles = "Administrator")]
    public class UsersController : Controller {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<UsersController> _logger;
        public UsersController(ILogger<UsersController> logger,
                RoleManager<IdentityRole> roleManager,
                UserManager<IdentityUser> userManager) {
            _logger = logger;
            _roleManager = roleManager;
            _userManager = userManager;            
        }

        private async Task AddRole() {
            //access to current user
            /*
            var cuser = this.User;
            var user = await _userManager.GetUserAsync(cuser);
            */
            // access to user.Email, user.UserName
            var roleNames = Roles.RoleNames;
            foreach (var RoleName in roleNames) {
                if (!(await _roleManager.RoleExistsAsync(RoleName))) {
                    IdentityRole arole = new IdentityRole();
                    arole.Name = RoleName;
                    arole.NormalizedName = RoleName.ToUpper();
                    await _roleManager.CreateAsync(arole);
                }
            }
        }

        // GET: UserController
        public async Task<ActionResult> Index() {
            List<User> users = new List<User>();
            var roles = _roleManager.Roles;
            if (roles.Count() <5) {
               await AddRole();
            }
            var dbusers = _userManager.Users.ToList();
            foreach (var dbuser in dbusers) {
                User user = new User();
                user.Id = dbuser.Id;
                user.UserName = dbuser.UserName;
                user.Email = dbuser.Email;

                string rolesStr = "";
                foreach (var role in Roles.RoleNames) {
                    bool yn = await _userManager.IsInRoleAsync(dbuser, role);
                    if (yn) {
                        if (rolesStr =="" ) {
                            rolesStr = role;
                        } else {
                            rolesStr += "," + role;
                        }
                    }
                }
                user.Roles = rolesStr;
                users.Add(user);
                
                if (user.Email.Contains("kyosaitec")) {
                    //await _userManager.AddToRoleAsync(dbuser, "KyosaiUser");
                }
                               
            }
            var ur = _userManager.SupportsUserRole;
            return View(users);
        }

        // GET: UserController/Details/5
        public async Task<ActionResult> Details(string Id) {
            User userToEdit = new User();
            var duser = await _userManager.FindByIdAsync(Id);
            userToEdit.Id = Id;
            userToEdit.UserName = duser.UserName;
            userToEdit.Email = duser.Email;
            userToEdit.Administrator = await _userManager.IsInRoleAsync(duser, Roles.Administrator);
            userToEdit.DataAdmin = await _userManager.IsInRoleAsync(duser, Roles.DataAdmin);
            userToEdit.SuperUser = await _userManager.IsInRoleAsync(duser, Roles.SuperUser);
            userToEdit.KyosaiUser = await _userManager.IsInRoleAsync(duser, Roles.KyosaiUser);
            userToEdit.Supplier = await _userManager.IsInRoleAsync(duser, Roles.Supplier);
            return View(userToEdit);
        }


        // GET: UserController/Edit/5
        async public Task<ActionResult> Edit(string Id) {
            User userToEdit = new User();
            var duser =await _userManager.FindByIdAsync(Id);
            userToEdit.Id = Id;
            userToEdit.UserName = duser.UserName;
            userToEdit.Email = duser.Email;
            userToEdit.Administrator = await _userManager.IsInRoleAsync(duser, Roles.Administrator);
            userToEdit.DataAdmin = await _userManager.IsInRoleAsync(duser, Roles.DataAdmin);
            userToEdit.SuperUser = await _userManager.IsInRoleAsync(duser, Roles.SuperUser);
            userToEdit.KyosaiUser = await _userManager.IsInRoleAsync(duser, Roles.KyosaiUser);
            userToEdit.Supplier = await _userManager.IsInRoleAsync(duser, Roles.Supplier);
            return View(userToEdit);
        }

        // POST: UserController/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        async public Task<ActionResult> Edit(string Id, [Bind("Id, UserName,Email, Administrator, DataAdmin, SuperUser, KyosaiUser, Supplier")] User userEdited) {
            try {
                var duser = await _userManager.FindByIdAsync(userEdited.Id);
                //duser.Email = userEdited.Email;
                //duser.NormalizedEmail = duser.Email.ToUpper();
                //duser.UserName = userEdited.UserName;
                //duser.NormalizedUserName = duser.UserName.ToUpper();
                //await _userManager.UpdateAsync(duser);
                if (userEdited.Administrator) {
                    await _userManager.AddToRoleAsync(duser, Roles.Administrator);
                } else {
                    await _userManager.RemoveFromRoleAsync(duser, Roles.Administrator);
                }
                if (userEdited.DataAdmin) {
                    await _userManager.AddToRoleAsync(duser, Roles.DataAdmin);
                } else {
                    await _userManager.RemoveFromRoleAsync(duser, Roles.DataAdmin);
                }
                if (userEdited.SuperUser) {
                    await _userManager.AddToRoleAsync(duser, Roles.SuperUser);
                } else {
                    await _userManager.RemoveFromRoleAsync(duser, Roles.SuperUser);
                }
                if (userEdited.KyosaiUser) {
                    await _userManager.AddToRoleAsync(duser, Roles.KyosaiUser);
                } else {
                    await _userManager.RemoveFromRoleAsync(duser, Roles.KyosaiUser);
                }
                if (userEdited.Supplier) {
                    await _userManager.AddToRoleAsync(duser, Roles.Supplier);
                } else {
                    await _userManager.RemoveFromRoleAsync(duser, Roles.Supplier);
                }
                return RedirectToAction(nameof(Index));
            }
            catch {
                return View();
            }
        }

        // GET: UserController/Delete/5
        public async Task<ActionResult> Delete(string Id) {
            User userToEdit = new User();
            var duser = await _userManager.FindByIdAsync(Id);
            userToEdit.Id = Id;
            userToEdit.UserName = duser.UserName;
            userToEdit.Email = duser.Email;
            userToEdit.Administrator = await _userManager.IsInRoleAsync(duser, Roles.Administrator);
            userToEdit.DataAdmin = await _userManager.IsInRoleAsync(duser, Roles.DataAdmin);
            userToEdit.SuperUser = await _userManager.IsInRoleAsync(duser, Roles.SuperUser);
            userToEdit.KyosaiUser = await _userManager.IsInRoleAsync(duser, Roles.KyosaiUser);
            userToEdit.Supplier = await _userManager.IsInRoleAsync(duser, Roles.Supplier);
            return View(userToEdit);

            return View();
        }

        // POST: UserController/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> DeleteConfirmed(string Id ) {
            try {
                var duser = await _userManager.FindByIdAsync(Id);
                await _userManager.DeleteAsync(duser);
                return RedirectToAction(nameof(Index));
            }
            catch {
                return View();
            }
        }
    }
}
