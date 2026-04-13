// app/energy/consumption/page.jsx - Update the import and usage

// Replace the import
import { EnergyConsumptionTable } from "@/components/energy-consumption-table";

// Then in the main content section, replace the Card content:
<Card className="bg-background/80 backdrop-blur-sm border-border/50">
  <CardHeader>
    <CardTitle>Energy Consumption Records</CardTitle>
    <CardDescription>
      Track and manage all energy consumption entries. Click on any record to view details.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <EnergyConsumptionTable 
      data={filteredRecords} 
      onUpdate={handleUpdateRecord}
      onDelete={handleDeleteRecord}
    />
  </CardContent>
</Card>