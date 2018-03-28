using System.Drawing;
using System.Windows.Forms;

namespace Union
{
    public class ExPanel : Panel
    {
        protected override Point ScrollToControl(Control activeControl)
        {
            return AutoScrollPosition;
        }
    }
}
