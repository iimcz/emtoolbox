using System.Collections.Generic;
using System.IO;
using System;

using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace backend.Packages
{
    /// Tamporary local storage implementation which looks at EMTOOLBOX_STORAGE
    /// and works with packages there. Currently supports only 3DS package .zip
    /// files.
    public static class LocalPackageStorage
    {
        private static string storagePath = 
            Environment.GetEnvironmentVariable("EMTOOLBOX_STORAGE");

        public static IEnumerable<string> ListPackages()
        {
            // TODO: This only checks the file is a zip file, doesn't check package type, since
            // there is no info about that yet.
            if (storagePath == null)
                return new string[0];
            return Directory.GetFiles(storagePath).Where((f) => f.EndsWith(".zip")).Select((f) => Path.GetFileName(f));
        }

        public static string GetPackagePath(string packageName)
        {
            return Path.Combine(storagePath, packageName);
        }

        public static string GetPackageChecksum(string packageName)
        {
            using (var hasher = HashAlgorithm.Create("SHA256"))
            using (FileStream stream = new FileStream(Path.Combine(storagePath, packageName), FileMode.Open))
            {
                StringBuilder sb = new StringBuilder();
                var bytes = hasher.ComputeHash(stream);
                foreach (byte b in bytes)
                {
                    sb.Append(b.ToString("x2"));
                }

                return sb.ToString();
            }
        }
    }
}