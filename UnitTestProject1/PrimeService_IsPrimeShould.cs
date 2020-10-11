using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Text;
using PrimeServices;

namespace PrimeServices.Unittests.Services {
    [TestClass]
    public class PrimeService_IsPrimeShould {
        private readonly PrimeService _primeService;
        public PrimeService_IsPrimeShould() {
            _primeService = new PrimeService();
        }
        
    }
}
