import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "sap-mcp-demo",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {} // means this server support tools and will tell us about it dynamically
    }
  }
);

// Handle tool listing -> tools discovery phase
// basically claude ask MCP server what you can do and server replies witht eh following
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "say_hello",
        description: "Say hello to person",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string", // automatic conversion to string 1212-> "1212"
              description: "Name of the person to greet"
            }
          },
          required: ["name"]
        }
      },
      {
        name: "get_system_time",
        description: "Get the current time from the sever",
        inputSchema: {
          type: "object",
          properties: {

          }
        }
      },
      {
        name: "get_business_partner",
        description: "Get SAP Business Partner details by ID",
        inputSchema: {
          type: "object",
          properties: {
            bpId: {
              type: "string",
              description: "Business Partner ID"
            }
          },
          required: ["bpId"]
        }
      },
      {
        name: "search_business_partners",
        description: "Search SAP Business Partners with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            country: {
              type: "string",
              description: "Filter by country (optional)"
            },
            city: {
              type: "string",
              description: "Filter by city (optional)"
            }
          }
        }
      }
    ]
  };
});

// Handle tool calls
// eqv -> POST /executeTool
//  MOCK DATA
const mockBusinessPartners = [
      {
        BusinessPartner: "1000001",
        BusinessPartnerName: "Acme Corporation",
        Country: "IN",
        City: "Bengaluru",
        CreatedOn: "2023-06-01"
      },
      {
        BusinessPartner: "1000002",
        BusinessPartnerName: "Globex India Ltd",
        Country: "IN",
        City: "Mumbai",
        CreatedOn: "2023-07-15"
      },
      {
        BusinessPartner: "1000003",
        BusinessPartnerName: "Infosys Pvt Ltd",
        Country: "IN",
        City: "Pune",
        CreatedOn: "2023-08-20"
      }
    ];

server.setRequestHandler(CallToolRequestSchema, async (request) => {

  console.error(
    "Tool call:",
    JSON.stringify(request.params, null, 2)
  );

  const toolName = request.params.name;
  if (toolName === "say_hello") {
    const { name } = request.params.arguments;

    return {
      content: [
        {
          type: "text",
          text: `Hello ${name}, MCP server is working!`
        }
      ]
    };
  }

  if (toolName === "get_system_time") {
    return {
      content: [
        {
          type: "text",
          text: ` Server time is ${new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata"
          })}`
        }
      ]
    }
  }

  if (toolName === "get_business_partner") {

    const raw = request.params.arguments.bpId;
    const bpId =
      typeof raw === "object" && raw !== null
        ? String(raw.value ?? raw)
        : String(raw);

    // MOCK DATA

    


    const bp = mockBusinessPartners.find(
      (item) => item.BusinessPartner === bpId
    );


    if (!bp) {
      console.warn(` BP not found: ${bpId}`);
      return {
        content: [
          {
            type: "text",
            text: `Business Partner with ID ${bpId} not found`
          }
        ]
      }
    }


    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(bp, null, 2)
        }
      ]
    }
  }


  if (toolName === "search_business_partners") {
    const rawCountry = request.params.arguments.country;
    const rawCity = request.params.arguments.city;


    const country = typeof rawCountry === "object" && rawCountry !== null ? String(rawCountry.value ?? rawCountry) : rawCountry ? String(rawCountry) : null;

    const city = typeof rawCity === 'Object' && rawCity !== null ? String(rawCity.value ?? rawCity) : rawCity ? String(rawCity) : null

    let results = mockBusinessPartners;
    if (country) {
      results = results.filter(bp => bp.Country === country);
    }
    if (city) {
      results = results.filter(bp => bp.City === city);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2)
        }
      ]
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `Unknown tool: ${toolName}`
      }
    ]
  };

});

const transport = new StdioServerTransport(); // claude talks to server via this
await server.connect(transport);