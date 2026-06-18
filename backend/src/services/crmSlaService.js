'use strict';

const crmSlaService = {
  

  calculateDueAt(priority) {
    let hoursToAdd = 48; 

    switch (priority?.toLowerCase()) {
      case 'urgent':
        hoursToAdd = 4;
        break;
      case 'high':
        hoursToAdd = 24;
        break;
      case 'medium':
        hoursToAdd = 48;
        break;
      case 'low':
        hoursToAdd = 72;
        break;
    }

    const now = new Date();
    
    now.setHours(now.getHours() + hoursToAdd);
    return now;
  }
};

module.exports = crmSlaService;
