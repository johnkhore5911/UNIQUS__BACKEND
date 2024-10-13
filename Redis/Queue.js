import Queue from 'bull';
// use avien cloud ? use cloud (gcp) service if we use it
const loginQueue = new Queue('loginQueue', {
  redis: {
    host: '127.0.0.1',  
    port: 6379, 
  },
});

loginQueue.process(async (job) => {
  const { email, password } = job.data;
  console.log('Login request:', { email, password });
});
const registerQueue = new Queue('registerQueue', {
  redis: {
    host: '127.0.0.1',  
    port: 6379, 
  },
});

registerQueue.process(async (job) => {
  const { firstName, lastName, email, userRole, password } = job.data;
  console.log('Registration request:', { firstName, lastName, email, userRole, password });
});

export { loginQueue, registerQueue };
