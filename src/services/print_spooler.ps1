param(
    [string]$PrinterName,
    [string]$FilePath
)

$code = @'
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinterHelper
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public class DOCINFOW
    {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern Int32 StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOW di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendFileToPrinter(string szPrinterName, string szFileName)
    {
        IntPtr hPrinter = IntPtr.Zero;
        IntPtr pUnmanagedBytes = IntPtr.Zero;
        bool bSuccess = false;

        // Prepare DocInfo
        DOCINFOW di = new DOCINFOW();
        di.pDocName = "BossPOS Receipt";
        di.pDataType = "RAW"; // Using RAW for thermal printers

        try 
        {
            if (!OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero))
            {
                Console.WriteLine("Failed to open printer: " + szPrinterName + ". Error: " + Marshal.GetLastWin32Error());
                return false;
            }

            // Start Document
            if (StartDocPrinter(hPrinter, 1, di) > 0)
            {
                // Start Page
                if (StartPagePrinter(hPrinter))
                {
                    // Read data
                    byte[] bytes = File.ReadAllBytes(szFileName);
                    int nLength = bytes.Length;
                    
                    // Allocate unmanaged memory
                    pUnmanagedBytes = Marshal.AllocCoTaskMem(nLength);
                    Marshal.Copy(bytes, 0, pUnmanagedBytes, nLength);

                    int dwWritten = 0;
                    bSuccess = WritePrinter(hPrinter, pUnmanagedBytes, nLength, out dwWritten);
                    
                    // Cleanup unmanaged memory immediately after write
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);
                    pUnmanagedBytes = IntPtr.Zero;

                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            else
            {
                Console.WriteLine("StartDocPrinter failed. Error: " + Marshal.GetLastWin32Error());
            }
        } 
        catch (Exception ex) 
        {
            Console.WriteLine("Exception in RawPrinterHelper: " + ex.Message);
            bSuccess = false;
        }
        finally
        {
            if (pUnmanagedBytes != IntPtr.Zero)
            {
                Marshal.FreeCoTaskMem(pUnmanagedBytes);
            }
            if (hPrinter != IntPtr.Zero)
            {
                ClosePrinter(hPrinter);
            }
        }
        
        return bSuccess;
    }
}
'@

try {
    Add-Type -TypeDefinition $code -Language CSharp
} catch {
    # Type might already exist if session persisted (unlikely but safe)
    $msg = $_.Exception.Message
    if ($msg -notmatch "already exists") {
        Write-Error "Failed to compile printer helper: $msg"
        exit 1
    }
}

$success = [RawPrinterHelper]::SendFileToPrinter($PrinterName, $FilePath)
if ($success) {
    Write-Output "Success"
} else {
    Write-Error "Failed to print"
    exit 1
}
