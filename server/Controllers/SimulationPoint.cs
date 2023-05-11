using Dbscan;

namespace Server.Controllers;

public class SimulationPoint : IPointData
{
    public SimulationPoint(double x, double y) =>
        Point = new Point(x, y);

    public Point Point { get; }
}