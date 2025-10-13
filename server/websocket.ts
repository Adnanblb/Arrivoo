import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";

interface DeviceConnection {
  deviceId: string;
  hotelId: string;
  deviceType: string;
  ws: WebSocket;
}

interface WebSocketMessage {
  type: string;
  payload?: any;
}

// Store active connections mapped by device ID
const deviceConnections = new Map<string, DeviceConnection>();

// Store connections mapped by hotel ID for broadcasting
const hotelConnections = new Map<string, Set<string>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    noServer: true
  });

  // Manually handle upgrades only for /ws path
  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // Let other upgrade requests (like Vite HMR) pass through
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection established");
    
    let currentDeviceId: string | null = null;
    let currentHotelId: string | null = null;

    ws.on("message", async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case "register_device": {
            const { deviceId, hotelId, deviceType, browser, os, screenSize } = message.payload;
            
            // Update device in database with metadata
            await storage.updateDeviceSocketId(deviceId, deviceId, true, {
              browser,
              os,
              screenSize,
            });
            
            // Store connection
            currentDeviceId = deviceId;
            currentHotelId = hotelId;
            
            deviceConnections.set(deviceId, {
              deviceId,
              hotelId,
              deviceType,
              ws,
            });
            
            // Add to hotel connections
            if (!hotelConnections.has(hotelId)) {
              hotelConnections.set(hotelId, new Set());
            }
            hotelConnections.get(hotelId)!.add(deviceId);
            
            console.log(`Device registered: ${deviceId} (${deviceType}) for hotel ${hotelId}`);
            
            // Notify all devices in the same hotel about updated device list
            await broadcastDeviceList(hotelId);
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: "registration_confirmed",
              payload: { deviceId, hotelId }
            }));
            break;
          }

          case "send_contract_to_device": {
            const { contractId, deviceId, contract } = message.payload;
            
            const targetConnection = deviceConnections.get(deviceId);
            if (targetConnection && targetConnection.ws.readyState === WebSocket.OPEN) {
              // Send contract to target device
              // IMPORTANT: Send the ACTUAL contract.id (UUID), not the assignment ID
              targetConnection.ws.send(JSON.stringify({
                type: "receive_contract",
                payload: {
                  contractId: contract.id, // Use contract's actual UUID, not assignment ID
                  assignmentId: contractId, // Keep assignment ID for tracking
                  contract
                }
              }));
              
              console.log(`Contract ${contract.id} (assignment ${contractId}) sent to device ${deviceId}`);
              
              // Send confirmation back to sender
              ws.send(JSON.stringify({
                type: "contract_sent_confirmation",
                payload: { contractId, deviceId, success: true }
              }));
            } else {
              // Device not connected
              ws.send(JSON.stringify({
                type: "contract_sent_confirmation",
                payload: { 
                  contractId, 
                  deviceId, 
                  success: false,
                  error: "Device not connected"
                }
              }));
            }
            break;
          }

          case "contract_viewed": {
            const { contractId, assignmentId } = message.payload;
            
            // Update assignment status
            await storage.updateContractAssignmentStatus(
              assignmentId,
              "viewing",
              new Date()
            );
            
            // Broadcast status update to all devices in the hotel
            if (currentHotelId) {
              await broadcastToHotel(currentHotelId, {
                type: "contract_status_update",
                payload: {
                  contractId,
                  assignmentId,
                  status: "viewing"
                }
              });
            }
            break;
          }

          case "contract_signed": {
            const { contractId, assignmentId, signatureDataUrl, email, phone } = message.payload;
            
            console.log("[WebSocket] Contract signed payload:", {
              contractId,
              assignmentId,
              hasSignature: !!signatureDataUrl,
              email,
              phone
            });
            
            // Update contract with signature and contact information
            await storage.updateContractSignature(contractId, signatureDataUrl, email, phone);
            
            // Update assignment status
            await storage.updateContractAssignmentStatus(
              assignmentId,
              "signed",
              new Date()
            );
            
            // Broadcast status update and signature to all devices in the hotel
            if (currentHotelId) {
              await broadcastToHotel(currentHotelId, {
                type: "contract_status_update",
                payload: {
                  contractId,
                  assignmentId,
                  status: "signed",
                  signatureDataUrl,
                  email,
                  phone
                }
              });
            }
            break;
          }

          case "get_device_list": {
            const { hotelId } = message.payload;
            
            // Get devices from database
            const devices = await storage.getDevicesByHotel(hotelId);
            
            // Update with current online status
            const devicesWithStatus = devices.map(device => ({
              ...device,
              isOnline: deviceConnections.has(device.id)
            }));
            
            ws.send(JSON.stringify({
              type: "device_list",
              payload: { devices: devicesWithStatus }
            }));
            break;
          }

          case "ping":
            ws.send(JSON.stringify({ type: "pong" }));
            break;

          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", async () => {
      if (currentDeviceId) {
        console.log(`Device disconnected: ${currentDeviceId}`);
        
        // Update device status in database
        await storage.updateDeviceSocketId(currentDeviceId, null, false);
        
        // Remove from connections
        deviceConnections.delete(currentDeviceId);
        
        // Remove from hotel connections
        if (currentHotelId) {
          const hotelDevices = hotelConnections.get(currentHotelId);
          if (hotelDevices) {
            hotelDevices.delete(currentDeviceId);
            if (hotelDevices.size === 0) {
              hotelConnections.delete(currentHotelId);
            }
          }
          
          // Notify remaining devices in hotel
          await broadcastDeviceList(currentHotelId);
        }
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  console.log("WebSocket server initialized on /ws");
}

// Helper function to broadcast device list to all devices in a hotel
async function broadcastDeviceList(hotelId: string) {
  const devices = await storage.getDevicesByHotel(hotelId);
  
  const devicesWithStatus = devices.map(device => ({
    ...device,
    isOnline: deviceConnections.has(device.id)
  }));
  
  await broadcastToHotel(hotelId, {
    type: "device_list_update",
    payload: { devices: devicesWithStatus }
  });
}

// Helper function to broadcast message to all devices in a hotel
async function broadcastToHotel(hotelId: string, message: WebSocketMessage) {
  const hotelDevices = hotelConnections.get(hotelId);
  if (!hotelDevices) return;
  
  const messageStr = JSON.stringify(message);
  
  for (const deviceId of Array.from(hotelDevices)) {
    const connection = deviceConnections.get(deviceId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(messageStr);
    }
  }
}

// Export for testing purposes
export { deviceConnections, hotelConnections };
