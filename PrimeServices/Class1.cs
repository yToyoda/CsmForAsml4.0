using System;

namespace PrimeServices {
    public class PrimeService {
        public bool IsPrime(int candidate) {
            if (candidate < 2) {
                return false;
            } else {
                for (int divisor = 2; divisor <= Math.Sqrt(candidate); ++divisor) {
                    if (candidate % divisor == 0) {
                        return false;
                    }
                }
                return true;

                throw new NotImplementedException("Please create a test first.");
            }
        }
    }
}
