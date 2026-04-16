# MongoDB Atlas Setup for DiaFit

This document explains how to set up and connect the DiaFit application to MongoDB Atlas.

## MongoDB Atlas Setup

1. **Create a MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account or log in if you already have one

2. **Create a New Project**
   - Click on "Projects" in the top navigation
   - Click "New Project"
   - Name your project (e.g., "DiaFit")
   - Click "Create Project"

3. **Create a Cluster**
   - Click "Build a Database"
   - Choose the free tier option (M0)
   - Select your preferred cloud provider and region
   - Click "Create Cluster"

4. **Create a Database User**
   - From the sidebar, click "Database Access" under SECURITY
   - Click "Add New Database User"
   - Set Authentication Method to "Password"
   - Enter a username and password (save these securely)
   - Set User Privileges to "Read and write to any database"
   - Click "Add User"

5. **Configure Network Access**
   - From the sidebar, click "Network Access" under SECURITY
   - Click "Add IP Address"
   - For development, you can select "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, add your specific server IP addresses
   - Click "Confirm"

6. **Get Your Connection String**
   - From the Clusters view, click "Connect"
   - Choose "Connect your application"
   - Select "Node.js" and your version
   - Copy the connection string that looks like:
     ```
     mongodb+srv://<username>:<password>@cluster0.mongodb.net/diafit?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials

## Connecting DiaFit to MongoDB Atlas

1. **Update Environment Variables**
   - Open your `.env` file in the backend directory
   - Replace the `MONGODB_URI` value with your MongoDB Atlas connection string:
     ```
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/diafit?retryWrites=true&w=majority
     ```
   - Make sure to replace `<username>` and `<password>` with your actual credentials

2. **Test the Connection**
   - Run the test connection script:
     ```
     npm run test-db
     ```
   - Verify that the connection is successful

3. **Migrate Data (if needed)**
   - If you have existing data in a local MongoDB that you want to migrate:
     ```
     npm run migrate-data
     ```
   - This will copy all collections and documents from your local database to MongoDB Atlas

4. **Start the Server**
   - Run the server with:
     ```
     npm run dev
     ```
   - Check the console logs to verify the connection to MongoDB Atlas

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify your username and password in the connection string
   - Ensure your IP address is allowed in the Network Access settings
   - Check if your MongoDB Atlas cluster is active

2. **Authentication Failed**
   - Double-check your database user credentials
   - Ensure you've properly URL-encoded special characters in your password

3. **Database Not Found**
   - If you see "database not found" errors, don't worry. MongoDB Atlas will create the database on first write operation

4. **Slow Connection**
   - Try selecting a different region for your cluster that's closer to your application servers

### Getting Help

If you encounter issues not covered here, check:
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- MongoDB Atlas support through their website 