/**
 * MPML Parser Tests
 * Magic Prompt Markup Language 解析器测试
 */

import { MPMLParser, MPMLDocument } from '../../src/mpml/MPMLParser';
import { LoggerFactory } from '../../src/core/LoggerFactory';
import { EventBus } from '../../src/core/EventBus';

describe('MPMLParser', () => {
  let parser: MPMLParser;
  let logger: any;
  let eventBus: EventBus;

  beforeEach(() => {
    logger = LoggerFactory.createLogger({
      level: 'error',
      format: 'simple',
      outputs: ['console']
    });
    eventBus = new EventBus(logger);
    parser = new MPMLParser(logger, eventBus);
  });

  describe('Basic Parsing', () => {
    it('should parse a basic MPML document', async () => {
      const mpmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<mjos version="2.0" type="team-project" category="general">
  <metadata>
    <title>Test Project</title>
    <team>Test Team</team>
    <project-type>test</project-type>
    <collaboration-mode>sequential</collaboration-mode>
  </metadata>
</mjos>`;

      const document = await parser.parse(mpmlContent);
      
      expect(document.version).toBe('2.0');
      expect(document.type).toBe('team-project');
      expect(document.category).toBe('general');
      expect(document.metadata.title).toBe('Test Project');
      expect(document.metadata.team).toBe('Test Team');
    });

    it('should parse team configuration', async () => {
      const mpmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<mjos version="2.0" type="team-project" category="general">
  <metadata>
    <title>Test Project</title>
    <team>Test Team</team>
    <project-type>test</project-type>
    <collaboration-mode>sequential</collaboration-mode>
  </metadata>
  
  <team-config>
    <roles>
      <role id="architect" type="architect" priority="1" initial-state="READY" memory-access="global">
        <name>架构师</name>
        <capabilities>system-design,team-coordination</capabilities>
      </role>
      <role id="developer" type="developer" priority="2" initial-state="READY" memory-access="shared">
        <name>开发者</name>
        <capabilities>frontend-development,backend-development</capabilities>
      </role>
    </roles>
    
    <collaboration-rules>
      <rule type="handoff" from="architect" to="developer" condition="design_complete"/>
    </collaboration-rules>
  </team-config>
</mjos>`;

      const document = await parser.parse(mpmlContent);
      
      expect(document.teamConfig).toBeDefined();
      expect(document.teamConfig!.roles).toHaveLength(2);
      
      const architect = document.teamConfig!.roles[0];
      expect(architect.id).toBe('architect');
      expect(architect.type).toBe('architect');
      expect(architect.capabilities).toEqual(['system-design', 'team-coordination']);
      
      expect(document.teamConfig!.collaborationRules).toHaveLength(1);
      const rule = document.teamConfig!.collaborationRules[0];
      expect(rule.type).toBe('handoff');
      expect(rule.from).toBe('architect');
      expect(rule.to).toBe('developer');
    });

    it('should parse project memory configuration', async () => {
      const mpmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<mjos version="2.0" type="team-project" category="general">
  <metadata>
    <title>Test Project</title>
    <team>Test Team</team>
    <project-type>test</project-type>
    <collaboration-mode>sequential</collaboration-mode>
  </metadata>
  
  <project-memory>
    <context>
      <ref>@!memory://project/requirements</ref>
      <ref>@!memory://project/constraints</ref>
    </context>
    <history>
      <ref>@!memory://project/previous-projects</ref>
    </history>
    <lessons>
      <ref>@!memory://team/lessons-learned</ref>
    </lessons>
  </project-memory>
</mjos>`;

      const document = await parser.parse(mpmlContent);
      
      expect(document.projectMemory).toBeDefined();
      expect(document.projectMemory!.context).toHaveLength(2);
      expect(document.projectMemory!.history).toHaveLength(1);
      expect(document.projectMemory!.lessons).toHaveLength(1);
      
      expect(document.projectMemory!.context[0].ref).toBe('@!memory://project/requirements');
      expect(document.projectMemory!.context[0].type).toBe('project');
    });

    it('should parse workflow configuration', async () => {
      const mpmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<mjos version="2.0" type="workflow" category="development">
  <metadata>
    <title>Development Workflow</title>
    <team>Dev Team</team>
    <project-type>development</project-type>
    <collaboration-mode>sequential</collaboration-mode>
  </metadata>
  
  <workflow name="development_process">
    <description>Standard development process</description>
    <phase name="planning" owner="architect" collaborators="designer,developer" duration="2">
      <deliverables>requirements,architecture,design</deliverables>
    </phase>
    <phase name="implementation" owner="developer" collaborators="designer" duration="5">
      <deliverables>code,tests,documentation</deliverables>
    </phase>
    <triggers>
      <trigger event="project_start" condition="requirements_ready" action="start_planning"/>
      <trigger event="planning_complete" condition="design_approved" action="start_implementation"/>
    </triggers>
  </workflow>
</mjos>`;

      const document = await parser.parse(mpmlContent);
      
      expect(document.workflow).toBeDefined();
      expect(document.workflow!.name).toBe('development_process');
      expect(document.workflow!.phases).toHaveLength(2);
      
      const planningPhase = document.workflow!.phases[0];
      expect(planningPhase.name).toBe('planning');
      expect(planningPhase.owner).toBe('architect');
      expect(planningPhase.collaborators).toEqual(['designer', 'developer']);
      expect(planningPhase.deliverables).toEqual(['requirements', 'architecture', 'design']);
      
      expect(document.workflow!.triggers).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid XML', async () => {
      const invalidXML = '<invalid><unclosed>';
      
      await expect(parser.parse(invalidXML)).rejects.toThrow('XML parsing failed');
    });

    it('should handle missing root element', async () => {
      const invalidMPML = `<?xml version="1.0" encoding="UTF-8"?>
<invalid version="2.0">
  <metadata>
    <title>Test</title>
  </metadata>
</invalid>`;
      
      await expect(parser.parse(invalidMPML)).rejects.toThrow('missing <mjos> root element');
    });

    it('should handle missing version', async () => {
      const invalidMPML = `<?xml version="1.0" encoding="UTF-8"?>
<mjos type="team-project">
  <metadata>
    <title>Test</title>
  </metadata>
</mjos>`;
      
      await expect(parser.parse(invalidMPML)).rejects.toThrow('missing version attribute');
    });

    it('should handle missing metadata', async () => {
      const invalidMPML = `<?xml version="1.0" encoding="UTF-8"?>
<mjos version="2.0" type="team-project">
</mjos>`;
      
      await expect(parser.parse(invalidMPML)).rejects.toThrow('Missing metadata section');
    });
  });

  describe('Validation', () => {
    it('should validate a correct document', async () => {
      const mpmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<mjos version="2.0" type="team-project" category="general">
  <metadata>
    <title>Valid Project</title>
    <team>Valid Team</team>
    <project-type>test</project-type>
    <collaboration-mode>sequential</collaboration-mode>
  </metadata>
</mjos>`;

      const document = await parser.parse(mpmlContent);
      const isValid = await parser.validate(document);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid version', async () => {
      const document: MPMLDocument = {
        version: 'invalid',
        type: 'team-project',
        category: 'general',
        metadata: {
          title: 'Test',
          team: 'Test Team',
          projectType: 'test',
          collaborationMode: 'sequential'
        }
      };
      
      const isValid = await parser.validate(document);
      expect(isValid).toBe(false);
    });

    it('should reject invalid type', async () => {
      const document: MPMLDocument = {
        version: '2.0',
        type: 'invalid-type' as any,
        category: 'general',
        metadata: {
          title: 'Test',
          team: 'Test Team',
          projectType: 'test',
          collaborationMode: 'sequential'
        }
      };
      
      const isValid = await parser.validate(document);
      expect(isValid).toBe(false);
    });
  });

  describe('Event Emission', () => {
    it('should emit parse event on successful parsing', async () => {
      const mpmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<mjos version="2.0" type="team-project" category="general">
  <metadata>
    <title>Test Project</title>
    <team>Test Team</team>
    <project-type>test</project-type>
    <collaboration-mode>sequential</collaboration-mode>
  </metadata>
</mjos>`;

      let eventEmitted = false;
      eventBus.subscribeEvent('mpml.parsed', () => {
        eventEmitted = true;
      });

      await parser.parse(mpmlContent);
      
      // 给事件处理一些时间
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(eventEmitted).toBe(true);
    });

    it('should emit error event on parsing failure', async () => {
      const invalidXML = '<invalid><unclosed>';
      
      let errorEventEmitted = false;
      eventBus.subscribeEvent('mpml.parse_error', () => {
        errorEventEmitted = true;
      });

      try {
        await parser.parse(invalidXML);
      } catch (error) {
        // Expected to throw
      }
      
      // 给事件处理一些时间
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(errorEventEmitted).toBe(true);
    });
  });

  describe('Complex Scenarios', () => {
    it('should parse a complete MPML document', async () => {
      const complexMPML = `<?xml version="1.0" encoding="UTF-8"?>
<mjos version="2.0" type="team-project" category="full-stack-development">
  <metadata>
    <title>魔剑工作室多端游戏开发项目</title>
    <team>魔剑工作室</team>
    <project-type>multi-platform-game</project-type>
    <collaboration-mode>hybrid</collaboration-mode>
  </metadata>

  <team-config>
    <roles>
      <role id="moxiaozhi" type="architect" priority="1" initial-state="READY" memory-access="global">
        <name>莫小智</name>
        <capabilities>role-creation,system-architecture,team-collaboration</capabilities>
      </role>
      <role id="moxiaomei" type="designer" priority="2" initial-state="READY" memory-access="shared">
        <name>莫小美</name>
        <capabilities>ui-design,ux-optimization,visual-design</capabilities>
      </role>
    </roles>
    
    <collaboration-rules>
      <rule type="handoff" from="moxiaozhi" to="moxiaomei" condition="requirements_complete"/>
      <rule type="parallel" from="moxiaoma,moxiaocang" to="moxiaoceshi" condition="development_complete"/>
    </collaboration-rules>
  </team-config>

  <project-memory>
    <context>
      <ref>@!memory://project/game-requirements</ref>
      <ref>@!memory://project/technical-constraints</ref>
    </context>
    <history>
      <ref>@!memory://project/previous-games</ref>
    </history>
    <lessons>
      <ref>@!memory://team/game-development-lessons</ref>
    </lessons>
  </project-memory>

  <workflow name="game_development">
    <description>多端游戏开发流程</description>
    <phase name="concept" owner="moxiaozhi" collaborators="moxiaomei" duration="1">
      <deliverables>游戏概念,技术选型,UI风格</deliverables>
    </phase>
    <phase name="development" owner="moxiaoma,moxiaocang" collaborators="moxiaomei" duration="8">
      <deliverables>游戏实现,多端适配,性能优化</deliverables>
    </phase>
    <triggers>
      <trigger event="project_start" condition="concept_approved" action="start_development"/>
      <trigger event="milestone_reached" condition="demo_ready" action="user_testing"/>
    </triggers>
  </workflow>
</mjos>`;

      const document = await parser.parse(complexMPML);
      
      expect(document.version).toBe('2.0');
      expect(document.type).toBe('team-project');
      expect(document.metadata.title).toBe('魔剑工作室多端游戏开发项目');
      expect(document.teamConfig!.roles).toHaveLength(2);
      expect(document.teamConfig!.collaborationRules).toHaveLength(2);
      expect(document.projectMemory!.context).toHaveLength(2);
      expect(document.workflow!.phases).toHaveLength(2);
      
      const isValid = await parser.validate(document);
      expect(isValid).toBe(true);
    });
  });
});
