using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using CsmForAsml.Models;
using Microsoft.AspNetCore.Authorization;

namespace CsmForAsml.Controllers {
    public class HomeController : Controller {
        private readonly ILogger<HomeController> _logger;
        private readonly CsmForAsml2Context _csm;

        public HomeController(ILogger<HomeController> logger, CsmForAsml2Context csm) {
            _logger = logger;
            _csm = csm;
        }

        public IActionResult Index() {
            // IEnumerable<CalInProcess>  cip = await _csm.CalInProcessRepository.GetAllRecordsAsync();
            // IEnumerable<CalInProcessBU> cipbu  = await _csm.CalInProcessBURepository.GetAllRecordsAsync();
            return  View();
        }

        public IActionResult Privacy() {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error() {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
