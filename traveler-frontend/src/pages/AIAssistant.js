import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Flight,
  Hotel,
  TrendingDown,
  Notifications,
  Star,
} from '@mui/icons-material';

const AI_API_URL = 'http://localhost:8000';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your Kayak AI travel concierge. Tell me about your trip plans and I'll find the best deals for you. Try something like:\n\n\"I've got Oct 25-27, SFO to anywhere warm, total budget $1,000 for two.\"",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bundles, setBundles] = useState([]);
  const [deals, setDeals] = useState({ flights: [], hotels: [] });
  const [wsConnected, setWsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`ws://localhost:8000/events`);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setWsConnected(true);
          ws.send(JSON.stringify({ type: 'subscribe_deals', deal_type: 'all' }));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_deal') {
            setNotifications(prev => [...prev, {
              id: Date.now(),
              message: `New ${data.deal_type} deal: ${data.why_this}`,
              score: data.score
            }]);
          }
          
          if (data.type === 'chat_response') {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: data.data.message
            }]);
            if (data.data.bundles) {
              setBundles(data.data.bundles);
            }
          }
        };
        
        ws.onclose = () => {
          setWsConnected(false);
          setTimeout(connectWebSocket, 5000);
        };
        
        wsRef.current = ws;
      } catch (err) {
        console.error('WebSocket error:', err);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch initial deals
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const [flightsRes, hotelsRes] = await Promise.all([
          fetch(`${AI_API_URL}/deals/flights?limit=5`),
          fetch(`${AI_API_URL}/deals/hotels?limit=5`)
        ]);
        
        if (flightsRes.ok && hotelsRes.ok) {
          const flights = await flightsRes.json();
          const hotels = await hotelsRes.json();
          setDeals({ flights: flights.deals, hotels: hotels.deals });
        }
      } catch (err) {
        console.error('Error fetching deals:', err);
      }
    };
    
    fetchDeals();
    const interval = setInterval(fetchDeals, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await fetch(`${AI_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          session_id: 'user-session-1'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message
        }]);
        
        if (data.clarifying_question) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.clarifying_question
          }]);
        }
        
        if (data.bundles && data.bundles.length > 0) {
          setBundles(data.bundles);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {/* Left Panel - Deals */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, position: 'sticky', top: 80 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingDown color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Hot Deals</Typography>
                <Badge badgeContent={wsConnected ? '🟢' : '🔴'} sx={{ ml: 'auto' }} />
              </Box>
              
              {deals.flights.slice(0, 3).map((deal, idx) => (
                <Card key={idx} sx={{ mb: 1 }} variant="outlined">
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Flight fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {deal.origin} → {deal.destination}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="primary" fontWeight={600}>
                      ${deal.price} <Typography component="span" variant="caption" sx={{ textDecoration: 'line-through', color: 'grey.500' }}>${deal.original_price}</Typography>
                    </Typography>
                    <Chip label={`${deal.discount_percent?.toFixed(0)}% off`} size="small" color="success" sx={{ mt: 0.5 }} />
                  </CardContent>
                </Card>
              ))}
              
              <Divider sx={{ my: 2 }} />
              
              {deals.hotels.slice(0, 3).map((deal, idx) => (
                <Card key={idx} sx={{ mb: 1 }} variant="outlined">
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Hotel fontSize="small" color="secondary" />
                      <Typography variant="body2" noWrap>{deal.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="secondary" fontWeight={600}>
                      ${deal.price_per_night}/night
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {deal.pet_friendly && <Chip label="🐕" size="small" />}
                      {deal.breakfast_included && <Chip label="🍳" size="small" />}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>
          
          {/* Center - Chat */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SmartToy />
                  <Typography variant="h6">Kayak AI Concierge</Typography>
                </Box>
                <Typography variant="caption">
                  I find deals, explain tradeoffs, and track prices for you
                </Typography>
              </Box>
              
              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {messages.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1, maxWidth: '80%' }}>
                      {msg.role === 'assistant' && (
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <SmartToy fontSize="small" />
                        </Avatar>
                      )}
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                          color: msg.role === 'user' ? 'white' : 'text.primary',
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </Typography>
                      </Paper>
                      {msg.role === 'user' && (
                        <Avatar sx={{ bgcolor: 'grey.400', width: 32, height: 32 }}>
                          <Person fontSize="small" />
                        </Avatar>
                      )}
                    </Box>
                  </Box>
                ))}
                {loading && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      <SmartToy fontSize="small" />
                    </Avatar>
                    <CircularProgress size={20} />
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>
              
              {/* Input */}
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Ask about travel deals, compare options, or track prices..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    size="small"
                    multiline
                    maxRows={3}
                  />
                  <IconButton color="primary" onClick={handleSend} disabled={loading}>
                    <Send />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          {/* Right Panel - Bundles */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, position: 'sticky', top: 80 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recommended Bundles
              </Typography>
              
              {bundles.length === 0 ? (
                <Alert severity="info">
                  Tell me about your trip and I'll find the best flight + hotel combinations!
                </Alert>
              ) : (
                bundles.map((bundle, idx) => (
                  <Card key={idx} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" color="primary">
                          ${bundle.total_price}
                        </Typography>
                        <Chip 
                          label={`${bundle.fit_score}% match`} 
                          color={bundle.fit_score >= 80 ? 'success' : bundle.fit_score >= 60 ? 'warning' : 'default'}
                          size="small"
                        />
                      </Box>
                      
                      {bundle.savings > 0 && (
                        <Typography variant="caption" color="success.main">
                          Save ${bundle.savings.toFixed(0)}
                        </Typography>
                      )}
                      
                      <Divider sx={{ my: 1 }} />
                      
                      {/* Flight */}
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Flight fontSize="small" />
                          <Typography variant="body2" fontWeight={600}>
                            {bundle.flight.origin} → {bundle.flight.destination}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {bundle.flight.airline} • ${bundle.flight.price}
                        </Typography>
                      </Box>
                      
                      {/* Hotel */}
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Hotel fontSize="small" />
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {bundle.hotel.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {[...Array(bundle.hotel.stars)].map((_, i) => (
                            <Star key={i} sx={{ fontSize: 12, color: '#ffc107' }} />
                          ))}
                          <Typography variant="caption" color="text.secondary">
                            ${bundle.hotel.price_per_night}/night
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Alert severity="info" sx={{ py: 0, mt: 1 }}>
                        <Typography variant="caption">
                          {bundle.why_this_bundle}
                        </Typography>
                      </Alert>
                      
                      <Button fullWidth variant="outlined" size="small" sx={{ mt: 1 }}>
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </Paper>
          </Grid>
        </Grid>
        
        {/* Notifications */}
        {notifications.length > 0 && (
          <Box sx={{ position: 'fixed', bottom: 20, right: 20 }}>
            {notifications.slice(-3).map((notif) => (
              <Alert 
                key={notif.id} 
                severity="success" 
                sx={{ mb: 1 }}
                onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
              >
                {notif.message}
              </Alert>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default AIAssistant;

