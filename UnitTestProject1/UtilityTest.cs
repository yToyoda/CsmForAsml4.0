using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Text;
using CsmForAsml.Tools;

namespace UnitTestProject1 {
    [TestClass]
    public class UtilityTest {
        [TestMethod]
        public void test() {
            DateTime day1 = new DateTime(2020, 09, 22);
            var day2 = AppResources.FirstDayOfNMonth( day1, 5);
            Assert.IsTrue(day2 == new DateTime(2021,2,1));
        }
    }
}
